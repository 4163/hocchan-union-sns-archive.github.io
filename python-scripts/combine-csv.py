import os
import pandas as pd

# Step 1: Get the current working directory
cwd = os.getcwd()

# Step 2: Define the CSV file paths
csv_files = [os.path.join(cwd, f'horieyui_staff_{i}.csv') for i in range(1, 2)]

# Step 3: Initialize a list to store DataFrames
dataframes = []

# Step 4: Read each CSV file and append the DataFrame to the list
for idx, csv_file in enumerate(csv_files):
    if idx == 0:
        # Read the first CSV with headers
        df = pd.read_csv(csv_file, encoding='utf-8')
    else:
        # Skip the header row for subsequent CSVs
        df = pd.read_csv(csv_file, encoding='utf-8', header=None, skiprows=1)
        df.columns = dataframes[0].columns  # Set columns to match the first file's columns
    
    dataframes.append(df)

# Step 5: Concatenate all DataFrames into one
combined_df = pd.concat(dataframes, ignore_index=True)

# Step 6: Remove any completely empty columns
combined_df.dropna(axis=1, how='all', inplace=True)

# Step 7: Remove completely empty rows
combined_df.dropna(axis=0, how='all', inplace=True)

# Step 8: Save the combined DataFrame to an Excel file
output_file = os.path.join(cwd, 'horieyui_staff_combined.xlsx')
combined_df.to_excel(output_file, index=False, engine='openpyxl')

print(f"Combined data saved to {output_file}")
