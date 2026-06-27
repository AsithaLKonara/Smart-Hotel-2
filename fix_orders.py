import os
import glob

files = [
    "app/admin/orders/page.tsx",
    "app/api/restaurant/orders/route.ts",
    "app/api/restaurant/orders/[id]/route.ts",
    "app/api/test-db-comprehensive/route.ts",
    "app/api/admin/pos/orders/route.ts",
    "app/api/admin/analytics/bi/route.ts",
    "app/api/pos/checkout/route.ts",
    "app/api/guest/spending/route.ts",
    "app/api/order-items/route.ts",
    "app/api/order-items/[id]/route.ts",
    "app/api/kitchen/orders/route.ts",
    "lib/ordering-api.ts",
    "lib/services/OrderService.ts",
    "lib/analytics/dashboard.ts",
    "tests/integration/advanced/analytics-bi.test.ts",
    "tests/e2e-workflows/kitchen-orders.spec.ts",
    "tests/utils/clean-db.ts",
    "tests/factories/operations.factory.ts"
]

for file_path in files:
    if not os.path.exists(file_path):
        continue
    with open(file_path, "r") as f:
        content = f.read()

    # Replacements
    content = content.replace("prisma.foodOrder", "prisma.internalOrder")
    content = content.replace("prisma.pOSOrder", "prisma.internalOrder")
    content = content.replace("FoodOrder", "InternalOrder")
    content = content.replace("POSOrder", "InternalOrder")
    content = content.replace("foodOrder", "internalOrder")
    content = content.replace("pOSOrder", "internalOrder")

    with open(file_path, "w") as f:
        f.write(content)

