# Custom Imports
from utils.investigation_class import Investigation

# Library Imports
import numpy as np
from shapely.geometry import mapping
from rasterio.features import shapes
from scipy.ndimage import binary_opening
from shapely.geometry import shape, MultiPolygon



class ForestInvestigation(Investigation):
    def __init__(self,
                lat, lon,
                sqkm,
                model_path = None,
                models_to_inference = None,
                observation_increments = [], #Years back to search
                logger = print
                ):
        
        if models_to_inference == None:
            model_tag = 'forest'
            models_to_inference = {model_tag: model_path}
            
        super().__init__(lat, lon, sqkm, models_to_inference, observation_increments, logger)
        

  
 

    def analyze_vegetation_change(self, model_tag, filter_width = 3):
        # Double check that there are enough observations to conduct a change analysis
        if len(self.observations) < 2:
            self.logger('No historical increments provided to analyze', 'status')
            return
        

        result = {}
        result['type'] = model_tag
        dates = [obs.date.date() for obs in self.observations]
        oldest_date = min(dates)
        newest_date = max(dates)
        result['dateRanges'] = str(oldest_date) +' - '+str(newest_date)
        result['dateList'] = [str(date) for date in dates]

        #identify labels present in all observations
        refined_label_map = self.observations[0].masks[model_tag]['metadata']['label_map'].copy()
        for obs in self.observations:
            to_del = []
            u = np.unique(obs.masks[model_tag]['mask'])
            for key in refined_label_map.keys():
                if key not in u: to_del.append(key)
            items_in_dict = refined_label_map.keys()
            for key in to_del:
                if key in  items_in_dict: del refined_label_map[key]


        

        '''
        Information I want to send back to the frontend:
        1. Name of Model
        2. Data Ranges
        3. List of Dates
        4. Change Log rows from each observation to the next
        5. Change log row for oldest and newest observation
        6. Image of each change

        '''


        # Generate Change Log rows
        def change_log_row(obs1, obs2, count, final=False):
            mask1 = obs1.masks[model_tag]
            mask2 = obs2.masks[model_tag]
            response = {}
            d1 = obs1.date.date()
            d2 = obs2.date.date()
            date_range = str(d1) + ' - ' + str(d2)

            if final: response['label'] = 'Summary'
            else: response['label'] = date_range
            row_data = []
            geom_data = []


            #refine the label_map to only values in the masks
            for key, value in refined_label_map.items():
                # Calculate where pixels have changed for that type
                mask1_veg = np.where(mask1['mask'] == key, 1, 0)
                mask2_veg = np.where(mask2['mask'] == key, 1, 0)
                change = mask2_veg - mask1_veg

                # Calculate percentage changes
                start_pix = mask2_veg.sum()
                end_pix = mask1_veg.sum()
                if start_pix > end_pix: change_dir = 'up'
                else: change_dir = 'down'
                percent_change = round(100*(abs(start_pix-end_pix)/start_pix), 1)
                sqkm_change = abs(start_pix-end_pix)/10000

                row_data.append({'class':value, 
                                 'changeIndex': count,
                                 'changeDirection':change_dir, 
                                 'percentChange': f'{percent_change}%',
                                 'sqkmChange': f'{sqkm_change:.2f} sqkm'
                                 })
                
                # Prepare the geojson
                # Filter out areas that are thinner than 30m at any point
                loss_change = binary_opening((change ==1), structure = np.ones((filter_width,filter_width)))
                growth_change = binary_opening((change ==-1), structure = np.ones((filter_width,filter_width)))

                compiled_change = np.zeros(change.shape)
                compiled_change[loss_change] = 1
                compiled_change[growth_change] = -1

                # Generate multipolygon shapes for changes
                transform = mask1['metadata']['transform']
                loss_geoms = shapes(loss_change.astype("uint8"), transform=transform)
                growth_geoms = shapes(growth_change.astype("uint8"), transform=transform)

                loss_polygons = [shape(geom) for geom, _ in loss_geoms]
                growth_polygons = [shape(geom) for geom, _ in growth_geoms]

                loss_multipoly = MultiPolygon(loss_polygons)
                growth_multipoly = MultiPolygon(growth_polygons)

                # Append the loss polygons
                geom_data.append({
                    'type': 'feature',
                    'geometry': mapping(loss_multipoly),
                    'properties':{
                        'label': value,
                        'dates': date_range,
                        'area': loss_multipoly.area,
                        'type': 'loss'
                    }
                })

                # Append the growth polygons
                geom_data.append({
                    'type': 'feature',
                    'geometry': mapping(growth_multipoly),
                    'properties':{
                        'label': value,
                        'dates': date_range,
                        'area': growth_multipoly.area,
                        'type': 'growth'
                    }
                })

            
            response['changes'] = row_data
            return response, geom_data


        # Generate Change Log
        change_log_rows = []
        geojson_data = {
            "type": "FeatureCollection",
            "name": "Vegetation Change Report",
            "features": []
        }
        count = 1
        for i in range(len(self.observations)-1):
            obs1 = self.observations[i]
            obs2 = self.observations[i+1]
            cl_row, geom_rows = change_log_row(obs1, obs2, count)
            change_log_rows.append(cl_row)
            geojson_data['features'].extend(geom_rows)
            count +=1

        if len(self.observations) > 2:
            obs1 = self.observations[0]
            obs2 = self.observations[-1]
            cl_row, geom_rows = change_log_row(obs1, obs2, count, final=True)            
            change_log_rows.append(cl_row)
            geojson_data['features'].extend(geom_rows)

        result['changeLog'] = change_log_rows
        result['geojson'] = geojson_data

        self.logger(result, 'change_report')





 



















