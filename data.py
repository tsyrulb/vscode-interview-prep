import os
import pandas as pd
import kagglehub
import json

# Step 1: Download the dataset
path = kagglehub.dataset_download("thedevastator/coding-questions-with-solutions")
print("Path to dataset files:", path)

# Step 2: Define file paths for train and test CSV files
train_csv = os.path.join(path, "train.csv")
test_csv = os.path.join(path, "test.csv")
data_folder = "data"
output_json = os.path.join(data_folder, "coding_questions.json")

# Step 3: Load the CSV files
try:
    train_df = pd.read_csv(train_csv)
    test_df = pd.read_csv(test_csv)
    
    # Merge the two datasets
    combined_df = pd.concat([train_df, test_df], ignore_index=True)
    
    # Ensure the output folder exists
    if not os.path.exists(data_folder):
        os.makedirs(data_folder)

    # Step 4: Convert the combined DataFrame to JSON
    combined_df.to_json(output_json, orient="records", indent=4)

    print(f"Combined dataset saved to {output_json}")
except Exception as e:
    print("Error processing the dataset:", e)
