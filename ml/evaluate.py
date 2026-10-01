import joblib
import pandas as pd
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix, classification_report
)

def evaluate_model(model_path: str, test_data_path: str):
    """
    Step 8: Evaluate:
      - Accuracy
      - Precision
      - Recall
      - F1-score
      - ROC-AUC
      - Confusion matrix
    """
    artifact = joblib.load(model_path)
    model = artifact['model']
    features = artifact['features']

    df_test = pd.read_csv(test_data_path)
    X_test = df_test[features]
    y_test = df_test['deterioration_target']

    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    roc_auc = roc_auc_score(y_test, y_prob)
    cm = confusion_matrix(y_test, y_pred)

    print("\n========== MODEL EVALUATION REPORT ==========")
    print(f"Model Version : {artifact.get('model_version', 'v1')}")
    print(f"Accuracy      : {acc:.4f}")
    print(f"Precision     : {prec:.4f}")
    print(f"Recall        : {rec:.4f}")
    print(f"F1-Score      : {f1:.4f}")
    print(f"ROC-AUC       : {roc_auc:.4f}")
    print("\nConfusion Matrix:")
    print(cm)
    print("=============================================\n")

    return {
        "accuracy": acc,
        "precision": prec,
        "recall": rec,
        "f1": f1,
        "roc_auc": roc_auc,
        "confusion_matrix": cm.tolist()
    }

if __name__ == "__main__":
    print("Evaluation module loaded.")
