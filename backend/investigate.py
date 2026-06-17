# Custom Imports
from backend.investigation_class import Investigation

# Library Imports
import numpy as np
from rasterio.features import shapes
from scipy.ndimage import binary_opening
from shapely.geometry import shape, MultiPolygon



class ForestInvestigation(Investigation):
    def __init__(self,
                lat, lon,
                sqkm,
                model_path,
                observation_increments = [1, 3, 5], #Years back to search
                logger = print
                ):
        
        model_tag = 'forest'
        models_to_inference = {model_tag: model_path}
        super().__init__(lat, lon, sqkm, models_to_inference, observation_increments, logger)
        
        self.analyze_vegetation_change(model_tag)




    def analyze_vegetation_change(self, forest_model_tag, filter_width = 3):
        # Double check that there are enough observations to conduct a change analysis
        if len(self.observations) < 2:
            self.logger('No historical increments provided to analyze', 'status')
            return
        
        change_log_rows = []
        for i in range(len(self.observations)-1):
            for j in range(i+1,len(self.observations)):
                obs1 = self.observations[i]
                obs2 = self.observations[j]
                mask1 = obs1.masks[forest_model_tag]
                mask2 = obs2.masks[forest_model_tag]

                # Determine the key values that indicate a forest pixel
                forest_label_names = ['forest', 'Tree-cover', 'trees']
                keys = []    
                for key, value in mask1['metadata']['label_map'].items():
                    if value in forest_label_names: keys.append(key)

                # Calculate where forest pixels have changed
                mask1_veg = np.where(np.isin(mask1['mask'],keys), 1, 0)
                mask2_veg = np.where(np.isin(mask2['mask'],keys), 1, 0)
                change = mask2_veg - mask1_veg

                # Filter out areas that are thinner than 20m at any point
                loss_change = binary_opening((change ==1), structure = np.ones((filter_width,filter_width)))
                growth_change = binary_opening((change ==-1), structure = np.ones((filter_width,filter_width)))

                compiled_change = np.zeros(change.shape)
                compiled_change[loss_change] = 1
                compiled_change[growth_change] = -1

                # Generate multipolygon shapes for changes
                transform = mask1['metadata']['transform']
                veg_loss_geoms = shapes(loss_change.astype("uint8"), transform=transform)
                veg_growth_geoms = shapes(growth_change.astype("uint8"), transform=transform)

                veg_loss_polygons = [shape(geom) for geom, val in veg_loss_geoms]
                veg_growth_polygons = [shape(geom) for geom, val in veg_growth_geoms]

                veg_loss_multipoly = MultiPolygon(veg_loss_polygons)
                veg_growth_multipoly = MultiPolygon(veg_growth_polygons)

                # Calculate percentage changes
                start_pix = mask2_veg.sum()
                end_pix = mask1_veg.sum()
                percent_change = round(100*(end_pix/start_pix), 2)


                change_log = {
                    'older_observation_date': obs2.date,
                    'newer_observation_date': obs1.date,
                    'older_observation': obs2,
                    'newer_observation': obs1,
                    'veg_loss_area': veg_loss_multipoly.area,
                    'veg_growth_area': veg_growth_multipoly.area,
                    'percent_veg_change': percent_change,
                    'veg_loss_pixels': loss_change.sum(),
                    'no_veg_change_pixels': (compiled_change == 0).sum(),
                    'veg_growth_pixels': growth_change.sum(),
                    'change_mask': compiled_change,
                    'veg_growth_multipolygons': veg_growth_multipoly,
                    'veg_loss_multipolygons': veg_loss_multipoly
                }
                change_log_rows.append(change_log)

        self.veg_change_log = self.ChangeLog(
            change_log_rows, 
            geometry = 'veg_loss_multipolygons',
            crs = self.observations[0].masks[forest_model_tag]['metadata']['crs']
            )
        
        sub_log = self.veg_change_log[self.veg_change_log['newer_observation_date'] == max(self.veg_change_log['newer_observation_date'])]
        line_log = sub_log[sub_log['older_observation_date'] == min(sub_log['older_observation_date'])]
        self.logger('Mask displaying total vegetation change')
        self.logger('Green: Collective Vegetaion Growth  |  Red: Collective Vegetation Loss')
        self.logger(line_log.generate_change_image(0),'image')

        sub_log = sub_log[['newer_observation_date','older_observation_date', 'percent_veg_change']]
        sub_log.rename(columns={'newer_observation_date':'Most Recent Observation Date',
                        'older_observation_date':'Historical Observation Date',
                        'percent_veg_change':'Percentage of Historical Vegetation Remaining'
                        }, inplace=True)
        col_text = ''
        for col in sub_log.columns:
            col_text += str(col)
            if col != sub_log.columns[-1]: col_text += ' | '
        self.logger(col_text)


        for row in sub_log.itertuples(index=False):
            line = ''
            line += '          ' + str(row[0]) + '         |'
            line += '          ' + str(row[1]) + '         |'
            line += '                     ' + str(row[2]) + '                    '
            self.logger(line)
        
        
    











