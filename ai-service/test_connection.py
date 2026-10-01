import pandas as pd
import joblib

# Load dataset
df = pd.read_csv("datasets/ERP_AI_Inventory_Dataset_750.csv")

# Load trained model
model = joblib.load("model/demand_model.pkl")

# Features used by the model
features = [
    "Inventory_Level",
    "Units_Sold",
    "Units_Ordered",
    "Supplier_Lead_Time",
    "Price",
    "Discount_Percent",
    "Promotion"
]

# Select features
X = df[features]

# Make prediction using first row
prediction = model.predict(X.head(1))

print("✅ Dataset loaded")
print("✅ Model loaded")
print("✅ Features matched")
print("Sample prediction:", prediction[0])