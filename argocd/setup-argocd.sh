#!/usr/bin/env bash
# ==============================================================================
# Setup ArgoCD on Local Kubernetes (minikube / k3s / kind / Docker Desktop)
# ==============================================================================

set -e

echo "🚀 Step 1: Creating 'argocd' namespace in local Kubernetes cluster..."
kubectl create namespace argocd || echo "Namespace 'argocd' already exists."

echo "📦 Step 2: Installing ArgoCD Controller & Web UI..."
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

echo "⏳ Step 3: Waiting for ArgoCD Server pods to become Ready..."
kubectl wait --namespace argocd --for=condition=ready pod --selector=app.kubernetes.io/name=argocd-server --timeout=180s || true

echo "🔑 Step 4: Extracting ArgoCD initial admin password..."
ARGOCD_PASS=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" 2>/dev/null | base64 -d || echo "Unavailable")

echo "📄 Step 5: Applying GitOps Application manifest (argocd-app.yaml)..."
kubectl apply -f "$(dirname "$0")/argocd-app.yaml"

echo ""
echo "=============================================================================="
echo "✅ ArgoCD Installation & Configuration Complete!"
echo "------------------------------------------------------------------------------"
echo "🌐 ArgoCD Web UI URL:    https://localhost:8080"
echo "👤 Admin Username:      admin"
echo "🔑 Admin Password:      $ARGOCD_PASS"
echo "------------------------------------------------------------------------------"
echo "💡 To access ArgoCD Web UI in browser, run port-forward command:"
echo "   kubectl port-forward svc/argocd-server -n argocd 8080:443"
echo "=============================================================================="
