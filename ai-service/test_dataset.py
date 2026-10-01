import pandas as pd

df = pd.read_csv("datasets/ERP_AI_Inventory_Dataset_750.csv")

print("Dataset loaded successfully!")
print("Rows:", len(df))
print("Columns:")
print(df.columns.tolist())

print("\nFirst 5 rows:")
print(df.head())