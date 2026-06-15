# Install Python
FROM condaforge/miniforge3

# Set the Working Directory
WORKDIR /app

# Copy the requirements
COPY backend/environment.yaml .

# Install the requirements
RUN conda clean -a -y && \
    conda install -n base -c conda-forge mamba && \
    mamba env create -f environment.yaml && \
    conda clean -a -y

# Copy all the files
COPY backend/ backend/

# Set the Env and run the CMD
ENV PATH=/opt/conda/envs/geo-env/bin:$PATH
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]





