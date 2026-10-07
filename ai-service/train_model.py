import os
import joblib
import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.tree import DecisionTreeRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


# ---------------------------------------
# 1. Load Dataset
# ---------------------------------------

DATASET_PATH = "datasets/ERP_AI_Inventory_Dataset_750.csv"

print("=" * 55)
print("      ERP AI - DEMAND FORECAST MODEL TRAINING")
print("=" * 55)

print("\n[1] Loading dataset...")

df = pd.read_csv(DATASET_PATH)

print(f"Dataset loaded successfully.")
print(f"Number of records: {len(df)}")
print(f"Number of columns: {len(df.columns)}")


# ---------------------------------------
# 2. Select Features and Target
# ---------------------------------------

features = [
    "Inventory_Level",
    "Units_Sold",
    "Units_Ordered",
    "Supplier_Lead_Time",
    "Price",
    "Discount_Percent",
    "Promotion"
]

target = "Demand_Forecast"

X = df[features]
y = df[target]

print("\n[2] Features selected:")
for feature in features:
    print(f" - {feature}")

print(f"\nTarget: {target}")


# ---------------------------------------
# 3. Split Dataset
# ---------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42
)

print("\n[3] Dataset split completed")
print(f"Training records: {len(X_train)}")
print(f"Testing records : {len(X_test)}")


# ---------------------------------------
# 4. Train Decision Tree
# ---------------------------------------

print("\n[4] Training Decision Tree Regressor...")

decision_tree = DecisionTreeRegressor(
    random_state=42
)

decision_tree.fit(X_train, y_train)

dt_predictions = decision_tree.predict(X_test)

dt_mae = mean_absolute_error(y_test, dt_predictions)
dt_rmse = np.sqrt(mean_squared_error(y_test, dt_predictions))
dt_r2 = r2_score(y_test, dt_predictions)

print("Decision Tree training completed.")


# ---------------------------------------
# 5. Train Random Forest
# ---------------------------------------

print("\n[5] Training Random Forest Regressor...")

random_forest = RandomForestRegressor(
    n_estimators=100,
    random_state=42
)

random_forest.fit(X_train, y_train)

rf_predictions = random_forest.predict(X_test)

rf_mae = mean_absolute_error(y_test, rf_predictions)
rf_rmse = np.sqrt(mean_squared_error(y_test, rf_predictions))
rf_r2 = r2_score(y_test, rf_predictions)

print("Random Forest training completed.")


# ---------------------------------------
# 6. Evaluation
# ---------------------------------------

print("\n" + "=" * 55)
print("                 MODEL EVALUATION")
print("=" * 55)

print("\nDecision Tree Regressor")
print(f"MAE       : {dt_mae:.4f}")
print(f"RMSE      : {dt_rmse:.4f}")
print(f"R2 Score  : {dt_r2:.4f}")

print("\nRandom Forest Regressor")
print(f"MAE       : {rf_mae:.4f}")
print(f"RMSE      : {rf_rmse:.4f}")
print(f"R2 Score  : {rf_r2:.4f}")


# ---------------------------------------
# 7. Select Best Model
# ---------------------------------------

if rf_r2 >= dt_r2:
    best_model = random_forest
    best_model_name = "Random Forest Regressor"
else:
    best_model = decision_tree
    best_model_name = "Decision Tree Regressor"

print("\n" + "=" * 55)
print(f"SELECTED MODEL: {best_model_name}")
print("=" * 55)


# ---------------------------------------
# 8. Save Model
# ---------------------------------------

os.makedirs("models", exist_ok=True)

MODEL_PATH = "models/trained_demand_model.pkl"

joblib.dump(best_model, MODEL_PATH)

print(f"\nModel saved successfully:")
print(MODEL_PATH)


# ---------------------------------------
# 9. Prediction Example
# ---------------------------------------

sample = pd.DataFrame([{
    "Inventory_Level": 42,
    "Units_Sold": 8,
    "Units_Ordered": 20,
    "Supplier_Lead_Time": 5,
    "Price": 250000,
    "Discount_Percent": 5,
    "Promotion": 1
}])

prediction = best_model.predict(sample)[0]

print("\n" + "=" * 55)
print("                 PREDICTION EXAMPLE")
print("=" * 55)

print("Product             : Laptop")
print("Inventory Level     : 42")
print("Units Sold          : 8")
print("Units Ordered       : 20")
print("Supplier Lead Time  : 5 days")
print("Price               : 250000")
print("Discount            : 5%")
print("Promotion           : Yes")
print(f"Predicted Demand    : {prediction:.2f}")

print("\nModel training completed successfully.")