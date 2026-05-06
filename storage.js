window.CANGJIE_FINAL_LOCKED_STORAGE = {
  "system_version": "V1_FINAL_LOCKED",
  "seed_revision": "V1_RELEASE_ENTRY_CLEAN_001",
  "lockedAt": "2026-05-06T15:30:55.395Z",
  "source": "customer-test-clean-localStorage-export",
  "cleanup_policy": {
    "removed": [
      "内置演示商品",
      "内置演示批次",
      "内置演示订单",
      "内置演示客户",
      "内置演示货主"
    ],
    "preserved": [
      "当前最终HTML框架",
      "商户资料",
      "员工账号与权限",
      "打印配置",
      "系统版本锁定字段",
      "云同步配置与安全验证记录"
    ]
  },
  "localStorage": {
    "cangjieCurrentAccountV94": "{\"id\":\"admin\",\"role\":\"管理员\",\"name\":\"管理员\",\"phone\":\"13900001111\",\"wechat\":\"xiaoliwx\",\"status\":\"启用\",\"authorized\":true}",
    "cangjieEmployeesV93": "[{\"id\":\"emp_1777979399084\",\"name\":\"小李\",\"phone\":\"13900001111\",\"wechat\":\"xiaoliwx\",\"status\":\"启用\"}]",
    "cangjieMerchantProfileV92": "{\"title\":\"仓颉\",\"name\":\"四姐蔬菜批发\",\"address\":\"广西海吉星农产品物流中心\",\"phone\":\"13800138000\"}",
    "cangjieCurrentAccountV93": "{\"id\":\"admin\",\"role\":\"管理员\",\"name\":\"管理员\",\"phone\":\"13800138000\",\"wechat\":\"xiaoliwx\",\"status\":\"启用\",\"authorized\":true}",
    "cangjieAdminAccountV93": "{\"id\":\"admin\",\"role\":\"管理员\",\"name\":\"管理员\",\"phone\":\"13800138000\",\"wechat\":\"\",\"status\":\"启用\"}",
    "tudou2_v57_persistent_data": "{\"goodsMaster\":[],\"batches\":[],\"owners\":[],\"cashierCustomers\":[{\"id\":\"c1\",\"name\":\"临时客户\",\"debt\":0,\"payments\":[],\"parentId\":\"\",\"disabled\":false}],\"savedCodeBills\":[],\"finalOrders\":[],\"buyerV47List\":{},\"activeBatchId\":\"\",\"cashierSelectedBatch\":\"\",\"cashierSelectedCat\":\"全\",\"savedAt\":\"V1_RELEASE_ENTRY_CLEAN_001\",\"orders\":[],\"codeBills\":[],\"buyerV47Orders\":[],\"buyerV47Repayments\":[],\"repayments\":[]}",
    "tudou2_v58_inventory_orders_data": "{\"finalOrders\":[],\"batches\":[],\"savedAt\":\"V1_RELEASE_ENTRY_CLEAN_001\"}",
    "cangjieMerchantLoginV92": "{\"loggedIn\":false,\"mode\":\"phone\",\"phone\":\"\",\"wechat\":\"\",\"time\":\"V1_RELEASE_ENTRY_CLEAN_001\",\"localMock\":true}",
    "cangjie_system_version": "V1_FINAL_LOCKED",
    "cangjie_seed_source": "storage.js",
    "cangjie_seed_revision": "V1_RELEASE_ENTRY_CLEAN_001",
    "cangjieCommercialSyncV1": "{\"merchantId\":\"mch_08230i\",\"userId\":\"admin\",\"deviceId\":\"dev_local_seed_7wgjwi\",\"role\":\"管理员\",\"deploymentMode\":\"cangjie_cloud\",\"databaseSource\":\"仓颉云 Supabase\",\"syncVersion\":2,\"lastSyncAt\":\"\",\"syncEnabled\":true,\"autoSyncEnabled\":false,\"autoSyncMode\":\"manual\",\"lastAutoSyncAt\":null,\"lastAutoSyncResult\":\"尚未自动上传\",\"lastCloudOrderSyncAt\":null,\"lastCloudOrderSyncResult\":\"尚未同步订单\",\"cloudStatus\":\"未连接\",\"dataUpdatedAt\":\"V1_RELEASE_ENTRY_CLEAN_001\",\"cloudUpdatedAt\":\"\",\"offlineAvailable\":true,\"conflictLogs\":[],\"syncLogs\":[{\"id\":\"sync_release_entry_clean_001\",\"time\":\"V1_RELEASE_ENTRY_CLEAN_001\",\"type\":\"init\",\"status\":\"未连接\",\"message\":\"客户测试版发布前收口：首次打开显示登录入口；后台为空系统，默认临时客户可用。\"}]}",
    "cangjieDeploymentConfigV1": "{\"deploymentMode\":\"cangjie_cloud\",\"privateSupabaseUrl\":\"\",\"privateSupabaseKey\":\"\",\"updatedAt\":\"V1_RELEASE_ENTRY_CLEAN_001\"}",
    "cangjieCloudSchemaV1": "{\"merchants\":{\"key\":\"merchantId\",\"binds\":[\"merchantId\"],\"description\":\"商户资料与同步设置\"},\"users\":{\"key\":\"userId\",\"binds\":[\"merchantId\",\"userId\"],\"description\":\"管理员和员工账号\"},\"permissions\":{\"key\":\"permissionId\",\"binds\":[\"merchantId\",\"userId\"],\"description\":\"员工权限范围\"},\"products\":{\"key\":\"productId\",\"binds\":[\"merchantId\"],\"description\":\"商品基础资料\"},\"owners\":{\"key\":\"ownerId\",\"binds\":[\"merchantId\"],\"description\":\"货主资料\"},\"customers\":{\"key\":\"customerId\",\"binds\":[\"merchantId\"],\"description\":\"买家资料\"},\"batches\":{\"key\":\"batchId\",\"binds\":[\"merchantId\"],\"description\":\"批次资料\"},\"inventory\":{\"key\":\"inventoryId\",\"binds\":[\"merchantId\",\"batchId\",\"productId\"],\"description\":\"库存快照和变动\"},\"orders\":{\"key\":\"orderId\",\"binds\":[\"merchantId\",\"userId\",\"deviceId\"],\"requiredOrderFields\":[\"userId\",\"employeeName\",\"deviceId\",\"createdAt\"],\"description\":\"订单流水\"},\"debts\":{\"key\":\"debtId\",\"binds\":[\"merchantId\",\"customerId\"],\"description\":\"欠款与还款流水\"},\"printSettings\":{\"key\":\"printSettingId\",\"binds\":[\"merchantId\",\"deviceId\"],\"description\":\"打印配置\"},\"syncLogs\":{\"key\":\"syncLogId\",\"binds\":[\"merchantId\",\"deviceId\"],\"description\":\"同步、冲突和离线日志\"}}"
  },
  "sessionStorage": {},
  "note": "客户测试版干净初始种子数据。首次打开为空系统：无商品、无批次、无订单；仅保留默认临时客户和基础配置。",
  "commercial_sync_architecture": {
    "phase": "customer_test_clean_initial_state",
    "realCloudConnected": false,
    "rule": "客户测试版默认空系统；storage.js 作为本地离线缓存，云同步逻辑保留且仍按 merchantId 分域。",
    "requiredFields": [
      "merchantId",
      "userId",
      "deviceId",
      "role",
      "deploymentMode",
      "databaseSource",
      "syncVersion",
      "lastSyncAt",
      "syncEnabled",
      "autoSyncEnabled",
      "autoSyncMode",
      "lastAutoSyncAt",
      "lastAutoSyncResult",
      "lastCloudOrderSyncAt",
      "lastCloudOrderSyncResult",
      "cloudStatus",
      "dataUpdatedAt"
    ],
    "cloudCollections": [
      "merchants",
      "users",
      "permissions",
      "products",
      "owners",
      "customers",
      "batches",
      "inventory",
      "orders",
      "debts",
      "printSettings",
      "syncLogs"
    ],
    "conflictPolicy": "cloudUpdatedAt 较新者优先；冲突时保留本地副本并写入 conflictLog。"
  }
};
