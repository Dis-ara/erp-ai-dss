import joblib

model = joblib.load("model/demand_model.pkl")

print("✅ Model loaded successfully!")
print(model)