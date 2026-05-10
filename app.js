/* extracted script block 2 */
/* ===== V1_FINAL_LOCKED：唯一初始化数据源锁定 ===== */
(function(){
  var FINAL_VERSION = "V1_FINAL_LOCKED";
  var APP_STATE_KEY = "CANGJIE_APP_STATE_V1";
  var LEGACY_STATE_KEY = "tudou2_v57_persistent_data";
  window.system_version = FINAL_VERSION;
  var VERSION_KEY = "cangjie_system_version";
  var SEED_KEY = "cangjie_seed_source";
  var REVISION_KEY = "cangjie_seed_revision";

  function seed(){
    return window.CANGJIE_FINAL_LOCKED_STORAGE || null;
  }
  function seedLocalStorage(){
    var data = seed();
    return data && data.system_version === FINAL_VERSION && data.localStorage ? data.localStorage : null;
  }
  function writeSeed(){
    var localData = seedLocalStorage();
    if(!localData) return false;
    try{
      localStorage.clear();
      sessionStorage.clear();
      Object.keys(localData).forEach(function(key){
        localStorage.setItem(key, String(localData[key]));
      });
      localStorage.setItem(VERSION_KEY, FINAL_VERSION);
      localStorage.setItem(SEED_KEY, "storage.js");
      localStorage.setItem(REVISION_KEY, String((seed() && seed().seed_revision) || ""));
      return true;
    }catch(err){
      console.error("V1_FINAL_LOCKED 初始化失败：", err);
      return false;
    }
  }
  function hasBusinessSnapshot(){
    try{
      var raw = localStorage.getItem(APP_STATE_KEY) || localStorage.getItem(LEGACY_STATE_KEY);
      if(!raw) return false;
      var data = JSON.parse(raw);
      if(!data || typeof data !== "object") return false;
      return [
        "goodsMaster","batches","owners","customers","cashierCustomers","orders","codeBills",
        "savedCodeBills","finalOrders","buyerV47Orders","buyerV47Repayments","buyerV47List","buyers","repayments"
      ].some(function(key){
        return Array.isArray(data[key]) ? data[key].length > 0 : !!data[key];
      });
    }catch(err){
      return false;
    }
  }
  function hasLocalBusinessKeys(){
    try{
      return [
        APP_STATE_KEY,
        "tudou2_v57_persistent_data",
        "cangjieMerchantProfileV92",
        "cangjieMerchantLoginV92",
        "cangjieEmployeesV94",
        "cangjieEmployeesV93",
        "cangjieCurrentAccountV94",
        "cangjieOwnerAccountV96",
        "currentUser",
        "tudou2_printer_config_step1"
      ].some(function(key){
        var raw = localStorage.getItem(key);
        return !!(raw && raw !== "null" && raw !== "undefined" && raw !== "{}" && raw !== "[]");
      });
    }catch(err){
      return false;
    }
  }
  function markSeedReady(){
    try{
      localStorage.setItem(VERSION_KEY, FINAL_VERSION);
      localStorage.setItem(SEED_KEY, "storage.js");
      localStorage.setItem(REVISION_KEY, String((seed() && seed().seed_revision) || ""));
    }catch(err){}
  }
  function ensureLockedSeed(){
    var hasPrimaryData = false;
    try{ hasPrimaryData = !!(localStorage.getItem(APP_STATE_KEY) || localStorage.getItem(LEGACY_STATE_KEY)); }catch(err){}
    var version = "";
    var source = "";
    var revision = "";
    var expectedRevision = "";
    try{
      version = localStorage.getItem(VERSION_KEY) || "";
      source = localStorage.getItem(SEED_KEY) || "";
      revision = localStorage.getItem(REVISION_KEY) || "";
      expectedRevision = String((seed() && seed().seed_revision) || "");
    }catch(err){}
    var hasBusinessData = hasPrimaryData || hasBusinessSnapshot() || hasLocalBusinessKeys();
    if(!hasBusinessData){
      writeSeed();
      return;
    }
    if(version !== FINAL_VERSION || source !== "storage.js" || revision !== expectedRevision){
      markSeedReady();
    }
  }
  window.cangjieResetToFinalLockedSeed = writeSeed;
  ensureLockedSeed();
})();

/* extracted script block 3 */
const categories = ["全","自","次","粉","红","尖","螺","泡","青","丝"];
let productCategories = ["根茎类","叶菜类","瓜果类","调料类"];
let owners = [];
let newBatchState = {owner:"", type:"自营"};

const goodsMaster = [];

let batches = [];

let activeBatchId = "";
let modalState = {
  grade:"不分级",
  pack:"定装",
  oversell:"允许库存超卖",
  basket:"不押筐"
};

function activeBatch(){
  return batches.find(b=>b.id===activeBatchId) || batches[0];
}
function money(n){ return Number(n||0).toFixed(2); }
function esc(s){
  return String(s ?? "").replace(/[&<>"']/g, function(m){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m];
  });
}
function toast(msg){
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(()=>el.classList.remove("show"), 1800);
}
function renderCat(){
  document.getElementById("catPanel").innerHTML = categories.map(c=>`<div class="cat">${c}</div>`).join("");
}
function renderBatches(){
  const q = document.getElementById("batchSearch").value.trim().toLowerCase();
  const list = batches.filter(b => {
    const ownerSettled = b && (b.ownerSettled || b.ownerSettlementAt || b.saleStatus === "settled");
    return !ownerSettled && (b.owner+b.no+b.tag).toLowerCase().includes(q);
  });
  document.getElementById("batchList").innerHTML = list.map(b => `
    <div class="batch-card ${b.id===activeBatchId?'active':''}" onclick="selectBatch('${b.id}')">
      <div class="owner">${esc(b.owner)}</div>
      <div class="no">${esc(b.no)}</div>
      <div class="tag">${esc(b.tag)}</div>
    </div>
  `).join("") || `<div class="hint" style="padding:14px 4px">暂无匹配批次</div>`;
}
function renderGoods(){
  const q = document.getElementById("goodsSearch").value.trim().toLowerCase();
  const batch = activeBatch();
  const list = goodsMaster.filter(g => [g.name,g.category,g.pack].join(" ").toLowerCase().includes(q));
  document.getElementById("goodsGrid").innerHTML = list.map(g => {
    const selected = !!(batch && Array.isArray(batch.items) && batch.items.some(i => i.goodsId === g.id));
    return `
      <div class="goods-card ${selected?'selected':''}" onclick="toggleGoodsToBatch('${g.id}')">
        <div class="tick"></div>
        <div class="name">${esc(g.name)}</div>
        <div class="type">${esc(g.pack || "未设包装")}${g.pack==="定装" && g.spec ? " ｜ " + esc(g.spec) + "斤/" + esc(g.unit || "件") + (Number(g.price || 0) > 0 ? " ｜ 销售价" + money(g.price || 0) : " ｜ 开单填售价") : ""}</div>
      </div>
    `;
  }).join("") || `<div class="hint">暂无匹配货品</div>`;
}
function isFixedPack(item){
  return item && item.pack === "定装" && Number(item.spec || 0) > 0;
}
function hasFixedPrice(item){
  return isFixedPack(item) && Number(item.fixedPrice ?? item.purchasePrice ?? 0) >= 0;
}
function fixedPrice(item){
  return Number(item.fixedPrice ?? item.salePrice ?? 0);
}
function calcWeight(item){
  if(isFixedPack(item)){
    return Number(item.qty || 0) * Number(item.spec || 0);
  }
  return Number(item.weight || 0);
}
function batchDetailItemStoppedStep1(item){
  return !!(item && (item.saleStopped || item.saleStatus === "stopped" || item.salePaused || item.settled || item.closed));
}
function toggleBatchDetailItemSaleStep1(itemId){
  const batch = activeBatch();
  if(!batch) return;
  const item = (batch.items || []).find(i => i && i.id === itemId);
  if(!item) return;
  if(item.settled || item.closed || item.saleStatus === "settled"){
    alert("该货品已售完，不能重新开售。");
    return;
  }
  if(batchDetailItemStoppedStep1(item)){
    item.saleStopped = false;
    item.salePaused = false;
    item.saleStatus = "selling";
    toast("货品已开售，收银台恢复显示");
  }else{
    item.saleStopped = true;
    item.saleStatus = "stopped";
    toast("货品已停售，收银台不再显示");
  }
  renderDetail();
  try{ if(typeof renderStockModule === "function") renderStockModule(); }catch(err){}
  try{ if(typeof renderInventoryStep1 === "function") renderInventoryStep1(); }catch(err){}
  try{ if(typeof renderCashierProducts === "function") renderCashierProducts(); }catch(err){}
  try{ if(typeof renderCashierBatches === "function") renderCashierBatches(); }catch(err){}
  try{ if(typeof tudou2SaveNow === "function") setTimeout(tudou2SaveNow, 0); }catch(err){}
}
function patchBatchDetailSaleButtonsStep1(){
  const body = document.getElementById("detailBody");
  const batch = (typeof activeBatch === "function") ? activeBatch() : null;
  if(!body || !batch || !Array.isArray(batch.items)) return;
  const q = (document.getElementById("detailSearch")?.value || "").trim().toLowerCase();
  const list = batch.items.filter(i => !q || String(i.name || "").toLowerCase().includes(q));
  Array.from(body.querySelectorAll("tr")).forEach((tr, idx) => {
    if(tr.classList.contains("summary")) return;
    const item = list[idx];
    if(!item) return;
    const actionCell = tr.querySelector("td:last-child");
    if(!actionCell || actionCell.querySelector(".batch-sale-toggle-step1")) return;
    const stopped = batchDetailItemStoppedStep1(item);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "action-btn batch-sale-toggle-step1" + (stopped ? " green" : "");
    btn.textContent = stopped ? "开售" : "停售";
    btn.onclick = function(ev){
      if(ev){
        ev.preventDefault();
        ev.stopPropagation();
      }
      toggleBatchDetailItemSaleStep1(item.id);
      return false;
    };
    actionCell.insertBefore(btn, actionCell.firstChild);
    const sale = tr.querySelector(".prod .sale");
    if(sale) sale.textContent = stopped ? "已停售" : "开售";
  });
}
function renderDetail(){
  const batch = activeBatch();
  if(!batch){
    document.getElementById("activeOwner").textContent = "暂无批次";
    document.getElementById("activeBatchNo").textContent = "-";
    const detailBody = document.getElementById("detailBody");
    const mobileDetail = document.getElementById("mobileDetailList");
    const feeTotalEl = document.getElementById("feeTotal");
    const costTotalEl = document.getElementById("costTotal");
    if(detailBody) detailBody.innerHTML = '<tr><td colspan="6" class="hint">暂无批次。请先新增货主和批次。</td></tr>';
    if(mobileDetail) mobileDetail.innerHTML = '<div class="hint">暂无批次。请先新增货主和批次。</div>';
    if(feeTotalEl) feeTotalEl.textContent = money(0);
    if(costTotalEl) costTotalEl.textContent = money(0);
    syncDeleteBatchButtonState();
    return;
  }
  document.getElementById("activeOwner").textContent = batch.owner;
  document.getElementById("activeBatchNo").textContent = batch.no;
  const q = document.getElementById("detailSearch").value.trim().toLowerCase();
  const list = batch.items.filter(i => i.name.toLowerCase().includes(q));

  let totalQty = 0, totalWeight = 0, purchaseTotal = 0, costTotal = 0;

  const rows = list.map((item, idx) => {
    const qty = Number(item.qty || 0);
    const weight = calcWeight(item);
    const purchasePrice = Number(item.purchasePrice || 0);
    const costPrice = Number(item.costPrice || 0);
    const purchaseAmount = isFixedPack(item) ? qty * purchasePrice : weight * purchasePrice;
    const costAmount = isFixedPack(item) ? qty * costPrice : weight * costPrice;
    const stock = qty - Number(item.sold || 0);
    const saleStopped = batchDetailItemStoppedStep1(item);
    const saleText = saleStopped ? "已停售" : "开售";
    const saleActionText = saleStopped ? "开售" : "停售";
    const saleActionClass = saleStopped ? "green" : "";

    totalQty += qty;
    totalWeight += weight;
    purchaseTotal += purchaseAmount;
    costTotal += costAmount;

    return `
      <tr>
        <td><span class="no-circle">${idx+1}</span></td>
        <td class="prod">
          <b>${esc(item.name)}</b>
          <span class="sale">${saleText}</span>
          <span class="sub">${esc(item.type)}${item.pack ? "｜" + esc(item.pack) : ""}${isFixedPack(item) ? "｜" + esc(item.spec) + "斤/" + esc(item.unit || "件") : ""}</span>
        </td>
        <td class="cell-input">
          <input type="number" min="0" step="1" value="${item.qty}" onchange="saveItemField('${item.id}','qty',this.value)">
          <span class="unit">件</span>
        </td>
        <td class="cell-input">
          ${isFixedPack(item) 
            ? `<input type="number" min="0" step="0.01" value="${calcWeight(item)}" readonly title="定装商品自动按规格计算重量">
               <span class="unit">自动：${item.qty || 0} × ${item.spec}斤/${esc(item.unit || "件")}</span>`
            : `<input type="number" min="0" step="0.01" value="${item.weight}" placeholder="可后补" onchange="saveItemField('${item.id}','weight',this.value)">
               <span class="unit">斤</span>`}
        </td>
        <td class="cell-input">
          <input type="number" min="0" step="0.01" value="${item.purchasePrice}" onchange="saveItemField('${item.id}','purchasePrice',this.value)">
          <span class="unit">${isFixedPack(item) ? "采购件价 元/件" : "采购斤价 元/斤"}</span>
        </td>
        <td class="money">${money(purchaseAmount)}</td>
      </tr>
    `;
  }).join("");

  document.getElementById("detailBody").innerHTML = rows + `
    <tr class="summary">
      <td></td>
      <td>合计</td>
      <td>${totalQty}</td>
      <td>${totalWeight}</td>
      <td>--</td>
      <td class="money">${money(purchaseTotal)}</td>
    </tr>
  `;

  document.getElementById("mobileDetailBody").innerHTML = list.map((item, idx) => {
    const qty = Number(item.qty || 0);
    const weight = calcWeight(item);
    const purchasePrice = Number(item.purchasePrice || 0);
    const costPrice = Number(item.costPrice || 0);
    const purchaseAmount = isFixedPack(item) ? qty * purchasePrice : weight * purchasePrice;
    const costAmount = isFixedPack(item) ? qty * costPrice : weight * costPrice;
    const stock = qty - Number(item.sold || 0);
    const saleStopped = batchDetailItemStoppedStep1(item);
    const saleActionText = saleStopped ? "开售" : "停售";
    const saleActionClass = saleStopped ? "green" : "";

    return `
      <div class="detail-card">
        <div class="detail-card-head">
          <div>
            <div class="detail-card-title">${idx+1}. ${esc(item.name)}</div>
            <div class="detail-card-sub">${esc(item.pack || "")}${isFixedPack(item) ? "｜" + esc(item.spec) + "斤/" + esc(item.unit || "件") : ""}</div>
          </div>
          <div class="no-circle">${idx+1}</div>
        </div>

        <div class="detail-card-grid">
          <div class="card-field">
            <label>入库数量</label>
            <input type="number" min="0" step="1" value="${item.qty}" onchange="saveItemField('${item.id}','qty',this.value)">
            <span class="card-unit">${esc(item.unit || "件")}</span>
          </div>

          <div class="card-field">
            <label>入库重量</label>
            ${isFixedPack(item)
              ? `<input class="readonly" type="number" value="${calcWeight(item)}" readonly>
                 <span class="card-unit">自动：${item.qty || 0} × ${item.spec}斤/${esc(item.unit || "件")}</span>`
              : `<input type="number" min="0" step="0.01" value="${item.weight}" placeholder="可后补" onchange="saveItemField('${item.id}','weight',this.value)">
                 <span class="card-unit">斤</span>`}
          </div>

          <div class="card-field">
            <label>采购单价</label>
            <input type="number" min="0" step="0.01" value="${item.purchasePrice}" onchange="saveItemField('${item.id}','purchasePrice',this.value)">
            <span class="card-unit">${isFixedPack(item) ? "采购件价 元/件" : "采购斤价 元/斤"}</span>
          </div>

          <div class="card-field">
            <label>采购金额</label>
            <div class="card-money">${money(purchaseAmount)}</div>
          </div>

          <div class="card-field">
            <label>成本单价</label>
            <input type="number" min="0" step="0.01" value="${item.costPrice}" onchange="saveItemField('${item.id}','costPrice',this.value)">
            <span class="card-unit">${isFixedPack(item) ? "成本件价 元/件" : "成本斤价 元/斤"}</span>
          </div>

          <div class="card-field">
            <label>采购成本</label>
            <div class="card-money">${money(costAmount)}</div>
          </div>

          <div class="card-field">
            <label>销量</label>
            <div class="card-money">${item.sold || 0}</div>
          </div>

          <div class="card-field">
            <label>库存</label>
            <div class="card-money">${stock}</div>
          </div>
        </div>

        <div class="detail-card-actions">
          <button class="action-btn ${saleActionClass}" onclick="toggleBatchDetailItemSaleStep1('${item.id}')">${saleActionText}</button>
          <button class="action-btn green" onclick="confirmSingleItem('${item.id}')">确认</button>
          <button class="action-btn" onclick="removeItem('${item.id}')">移除</button>
        </div>
      </div>
    `;
  }).join("") + `
    <div class="mobile-summary">
      <div style="margin-bottom:8px">合计</div>
      <div class="mobile-summary-grid">
        <div>总数量：${totalQty}</div>
        <div>总重量：${totalWeight}</div>
        <div>采购金额：${money(purchaseTotal)}</div>
        <div>采购成本：${money(costTotal)}</div>
      </div>
    </div>
  `;

  document.getElementById("feeTotal").textContent = money(batch.fee || 0);
  document.getElementById("costTotal").textContent = money(costTotal + Number(batch.fee || 0));
  syncDeleteBatchButtonState();
}
function renderAll(){
  renderCat();
  renderBatches();
  renderGoods();
  renderDetail();
  syncDeleteBatchButtonState();
  setTimeout(patchBatchDetailSaleButtonsStep1, 0);
}
function selectBatch(id){
  activeBatchId = id;
  renderAll();
  setTimeout(patchBatchDetailSaleButtonsStep1, 0);
}
function toggleGoodsToBatch(goodsId){
  const batch = activeBatch();
  if(!batch){
    toast("请先新增批次");
    return;
  }
  const exists = batch.items.find(i => i.goodsId === goodsId);
  if(exists){
    batch.items = batch.items.filter(i => i.goodsId !== goodsId);
    toast("已从当前批次移除货品");
  }else{
    const g = goodsMaster.find(x => x.id === goodsId);
    const fixedWeight = g.pack === "定装" && Number(g.spec || 0) > 0 ? 0 : "";
    batch.items.push({
      id:"i" + Date.now() + Math.floor(Math.random()*1000),
      goodsId:g.id,
      name:g.name,
      type:g.type,
      pack:g.pack || "非定装",
      spec:g.spec || "",
      unit:g.unit || "件",
      qty:0,
      weight:fixedWeight,
      purchasePrice:0,
      costPrice:0,
      salePrice:Number(g.price || 0),
      fixedPrice:g.pack === "定装" ? Number(g.price || 0) : undefined,
      sold:0
    });
    toast("已加入当前批次");
  }
  renderAll();
}
function saveItemField(itemId, field, value){
  const item = activeBatch().items.find(i => i.id === itemId);
  if(!item) return;

  if(field === "weight"){
    if(isFixedPack(item)){
      item.weight = Number(item.qty || 0) * Number(item.spec || 0);
    }else{
      item[field] = value === "" ? "" : Number(value);
    }
  }else{
    item[field] = Number(value || 0);
    if(field === "qty" && isFixedPack(item)){
      item.weight = Number(item.qty || 0) * Number(item.spec || 0);
    }
  }
  renderDetail();
}
function confirmSingleItem(itemId){
  const item = activeBatch().items.find(i => i.id === itemId);
  if(!item) return;
  toast("已确认：" + item.name);
}
function removeItem(itemId){
  const batch = activeBatch();
  batch.items = batch.items.filter(i => i.id !== itemId);
  renderAll();
  toast("已移除货品");
}
setTimeout(patchBatchDetailSaleButtonsStep1, 0);
setTimeout(patchBatchDetailSaleButtonsStep1, 300);
setTimeout(patchBatchDetailSaleButtonsStep1, 1000);
function nextBatchNoForOwner(owner){
  const nums = batches
    .filter(b => b.owner === owner)
    .map(b => parseInt(String(b.no).replace(/\D/g,""), 10))
    .filter(n => !Number.isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return String(next).padStart(2, "0");
}
function refreshBatchPreview(){
  const owner = document.getElementById("batchOwnerSelect")?.value || newBatchState.owner || "";
  newBatchState.owner = owner;
  const preview = document.getElementById("batchNoPreview");
  if(preview) preview.textContent = nextBatchNoForOwner(owner);
}
function setBatchType(type){
  newBatchState.type = type === "代卖" ? "代卖" : "自营";
  document.querySelectorAll("[data-batch-type]").forEach(btn=>{
    btn.classList.toggle("active", btn.dataset.batchType === newBatchState.type);
  });
}
function addBatch(){
  openBatchModal();
}
function openBatchModal(){
  renderOwnerOptions();
  newBatchState.owner = owners[0] || "";
  newBatchState.type = "自营";
  const sel = document.getElementById("batchOwnerSelect");
  if(sel) sel.value = newBatchState.owner;
  document.getElementById("batchModal").classList.add("show");
  setBatchType("自营");
  refreshBatchPreview();
}
function closeBatchModal(){
  document.getElementById("batchModal").classList.remove("show");
}
function renderOwnerOptions(){
  const sel = document.getElementById("batchOwnerSelect");
  if(!sel) return;
  sel.innerHTML = owners.map(o=>`<option value="${esc(o)}">${esc(o)}</option>`).join("");
}
function addOwnerFromBatchModal(){
  const name = prompt("请输入新增货主名称：");
  if(!name) return;
  const clean = name.trim();
  if(!clean) return;
  if(!owners.includes(clean)) owners.push(clean);
  renderOwnerOptions();
  document.getElementById("batchOwnerSelect").value = clean;
  refreshBatchPreview();
  toast("货主已新增");
}
function saveBatchFromModal(){
  const owner = (document.getElementById("batchOwnerSelect").value || "").trim();
  if(!owner){
    alert("请先新增货主");
    return;
  }
  const no = nextBatchNoForOwner(owner);
  const type = newBatchState.type === "代卖" ? "代卖" : "自营";
  const id = "b" + Date.now();
  batches.unshift({id, owner, no, tag:type, fee:0, remark:"", items:[]});
  activeBatchId = id;
  closeBatchModal();
  renderAll();
  toast(`${owner} 的新批次 ${no} 已新增`);
}
function renameBatch(){
  const batch = activeBatch();
  if(!batch){
    toast("暂无批次");
    return;
  }
  const owner = prompt("修改货主名称：", batch.owner);
  if(!owner) return;
  const no = prompt("修改批次号：", batch.no);
  if(!no) return;
  batch.owner = owner;
  if(!owners.includes(owner)) owners.push(owner);
  batch.no = no;
  renderAll();
  toast("批次已修改");
}
function stockBatchNormalizedNo(batch){
  return String((batch && (batch.no || batch.batchNo)) || "").trim();
}
function stockBatchNormalizedOwner(batch){
  return String((batch && (batch.owner || batch.ownerName)) || "").trim();
}
function stockBatchLineMatches(batch, line){
  if(!batch || !line) return false;
  if(line.batchId && String(batch.id || "") === String(line.batchId)) return true;
  const batchNo = stockBatchNormalizedNo(batch);
  const batchOwner = stockBatchNormalizedOwner(batch);
  const lineNo = String((line.batchNo || line.no || "")).trim();
  const lineOwner = String((line.owner || line.batchOwner || line.ownerName || "")).trim();
  if(lineNo && batchNo && lineNo !== batchNo) return false;
  if(lineOwner && batchOwner && lineOwner !== batchOwner) return false;
  if(lineNo && batchNo) return true;
  if(lineOwner && batchOwner) return true;
  return false;
}
function stockBatchHasSoldRecords(batch){
  return (batch?.items || []).some(item=>{
    const calc = typeof stockCalcItem === "function" ? stockCalcItem(item) : null;
    const soldQty = Number(calc?.sold || item?.sold || 0) || 0;
    const soldWeight = Number(calc?.soldWeight || item?.soldWeight || 0) || 0;
    return soldQty > 0 || soldWeight > 0;
  });
}
function stockBatchHasOrderRecords(batch){
  return (Array.isArray(finalOrders) ? finalOrders : []).some(order=>{
    const lines = Array.isArray(order?.lines) ? order.lines : [];
    return lines.some(line=>stockBatchLineMatches(batch, line));
  });
}
function stockBatchHasCodeBillUsage(batch){
  return (Array.isArray(savedCodeBills) ? savedCodeBills : []).some(bill=>{
    const lines = Array.isArray(bill?.lines) ? bill.lines : [];
    return lines.some(line=>stockBatchLineMatches(batch, line));
  });
}
function stockBatchDeleteBlockReason(batch){
  if(!batch) return "暂无批次";
  if(stockBatchHasOrderRecords(batch)) return "该批次已产生订单，不能删除，只能修改";
  if(stockBatchHasCodeBillUsage(batch)) return "该批次已有码单占用，不能删除，只能修改";
  if(stockBatchHasSoldRecords(batch)) return "该批次已产生销售记录，不能删除，只能修改";
  return "";
}
function syncDeleteBatchButtonState(){
  const btn = document.getElementById("deleteBatchBtn");
  const batch = typeof activeBatch === "function" ? activeBatch() : null;
  if(!btn) return;
  const reason = stockBatchDeleteBlockReason(batch);
  btn.disabled = !!reason;
  btn.title = reason || "删除当前批次";
  btn.textContent = reason ? "不可删除" : "删除批次";
}
function deleteBatch(){
  const batch = typeof activeBatch === "function" ? activeBatch() : null;
  const blockReason = stockBatchDeleteBlockReason(batch);
  if(blockReason){
    alert(blockReason);
    toast(blockReason);
    syncDeleteBatchButtonState();
    return;
  }
  if(batches.length <= 1){
    alert("至少保留一个批次");
    return;
  }
  if(!confirm("确定删除当前批次吗？")) return;
  batches = batches.filter(b => b.id !== activeBatchId);
  activeBatchId = batches[0].id;
  renderAll();
  toast("批次已删除");
}
function addFee(){
  const batch = activeBatch();
  if(!batch){
    toast("暂无批次");
    return;
  }
  const val = prompt("请输入费用金额：", String(batch.fee || 0));
  if(val === null) return;
  batch.fee = Number(val || 0);
  renderDetail();
  toast("费用已更新");
}
function addRemark(){
  const batch = activeBatch();
  if(!batch){
    toast("暂无批次");
    return;
  }
  const val = prompt("请输入备注：", batch.remark || "");
  if(val === null) return;
  batch.remark = val;
  toast("备注已保存");
}
function confirmInbound(){
  toast("当前批次已确认入库");
}

/* Modal logic */
function initModalSegments(){
  document.querySelectorAll("[data-group]").forEach(btn=>{
    btn.onclick = function(){
      const group = this.dataset.group;
      const value = this.dataset.value;
      modalState[group] = value;
      document.querySelectorAll('[data-group="'+group+'"]').forEach(b=>b.classList.remove("active"));
      this.classList.add("active");
    };
  });
}
function fillCategoryOptions(){
  const sel = document.getElementById("gmCategory");
  sel.innerHTML = productCategories.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join("");
}
function resetGoodsModal(){
  document.getElementById("gmName").value = "";
  document.getElementById("gmSpec").value = "";
  document.getElementById("gmPrice").value = "";
  document.getElementById("gmUnit").value = "件";
  modalState = {grade:"不分级", pack:"定装", oversell:"允许库存超卖", basket:"不押筐"};
  document.querySelectorAll('[data-group="grade"]').forEach((b,idx)=>b.classList.toggle("active", idx===0));
  document.querySelectorAll('[data-group="pack"]').forEach(b=>b.classList.toggle("active", b.dataset.value==="定装"));
  document.getElementById("oversellState").textContent = modalState.oversell + " ＞";
  document.getElementById("basketState").textContent = modalState.basket + " ＞";
  fillCategoryOptions();
}
function openGoodsModal(){
  resetGoodsModal();
  document.getElementById("goodsModal").classList.add("show");
}
function closeGoodsModal(){
  document.getElementById("goodsModal").classList.remove("show");
}
function addCategory(){
  const name = prompt("请输入新增分类名称：");
  if(!name) return;
  productCategories.push(name.trim());
  fillCategoryOptions();
  document.getElementById("gmCategory").value = name.trim();
  toast("分类已新增");
}
const oversellStateEl = document.getElementById("oversellState");
if(oversellStateEl){
  oversellStateEl.onclick = function(){
    modalState.oversell = modalState.oversell === "允许库存超卖" ? "不允许库存超卖" : "允许库存超卖";
    this.textContent = modalState.oversell + " ＞";
  };
}
const basketStateEl = document.getElementById("basketState");
if(basketStateEl){
  basketStateEl.onclick = function(){
    modalState.basket = modalState.basket === "不押筐" ? "押筐" : "不押筐";
    this.textContent = modalState.basket + " ＞";
  };
}
function saveGoodsFromModal(){
  const name = document.getElementById("gmName").value.trim();
  const category = document.getElementById("gmCategory").value;
  const spec = document.getElementById("gmSpec").value.trim();
  const unit = document.getElementById("gmUnit").value;
  const priceRaw = document.getElementById("gmPrice").value;
  const price = Number(priceRaw || 0);
  if(!name){
    alert("请先填写货品名称");
    return;
  }
  if(modalState.pack === "定装" && Number(spec || 0) <= 0){
    alert("定装货品必须填写固定斤数，例如 40。");
    return;
  }
  // 定装货品只强制填写固定斤数；货品单价可以不填。
  goodsMaster.unshift({
    id:"gm" + Date.now(),
    name,
    type:"非",
    category,
    pack:modalState.pack,
    grade:modalState.grade,
    spec: modalState.pack === "定装" ? Number(spec || 0) : spec,
    unit,
    price,
    fixedPrice: modalState.pack === "定装" ? price : undefined,
    oversell:modalState.oversell,
    basket:modalState.basket
  });
  closeGoodsModal();
  renderGoods();
  toast("新货品已保存");
}

window.addEventListener("keydown", function(e){
  if(e.key === "Escape"){
    closeGoodsModal();
    closeBatchModal();
    closeCodeBillModal();
    closeBillCenter();
    closeSettleOrderModal();
  }
});


/* ===== 收银码单闭环逻辑：选择客户 → 商品 → 码单 → 下单 ===== */
document.body.classList.add("show-inbound");

let cashierSelectedBatch = "";
let cashierSelectedCat = "全部";
let cashierCustomers = [
  {id:"c1", name:"临时客户", debt:0, payments:[], parentId:"", disabled:false}
];
let currentCodeBillItems = [];
let savedCodeBills = [];
let finalOrders = [];
var selectedBillCenterId = "";
var shortCodeBillCounter = 1;
var shortOrderCounter = 1;

function showAppPage(page){
  if(page === "cashier"){
    document.body.classList.remove("show-inbound");
    document.body.classList.add("show-cashier");
    renderCashierAll();
  }else{
    document.body.classList.remove("show-cashier");
    document.body.classList.add("show-inbound");
    renderAll();
  }
}

function activeCashierCustomer(){
  const chosen = window.currentBuyer || window.selectedBuyer || null;
  if(chosen && chosen.id){
    return cashierCustomers.find(c=>c.id === chosen.id) || chosen;
  }
  const id = document.getElementById("cashierCustomer")?.value;
  return cashierCustomers.find(c=>c.id === id) || cashierCustomers[0];
}

function addCashierCustomer(){
  const name = prompt("请输入买家名称：");
  if(!name) return;
  const clean = name.trim();
  if(!clean) return;
  const c = {id:"c" + Date.now(), name:clean, debt:0};
  cashierCustomers.push(c);
  renderCashierCustomers();
  document.getElementById("cashierCustomer").value = c.id;
  renderCurrentCodeBill();
  toast("买家已新增");
}

function renderCashierCustomers(){
  const sel = document.getElementById("cashierCustomer");
  if(!sel) return;
  const old = sel.value;
  sel.innerHTML = cashierCustomers.map(c=>`<option value="${c.id}">${esc(c.name)}${c.debt>0 ? "｜欠" + money(c.debt) : ""}</option>`).join("");
  if(old) sel.value = old;
}

function renderCashierBatches(){
  const allBtn = document.getElementById("cashierAllBatchesBtn");
  if(allBtn){
    allBtn.classList.toggle("active", !cashierSelectedBatch);
  }
  const box = document.getElementById("cashierBatchList");
  if(!box) return;
  const cards = batches.map(b=>`
    <div class="cashier-batch-card ${cashierSelectedBatch===b.id?'active':''}" onclick="selectCashierBatch('${b.id}')">
      <b>${esc(b.owner)}</b>
      <span>${esc(b.no)}｜${esc(b.tag)}</span>
    </div>
  `).join("");
  box.innerHTML = cards;
}

function selectCashierAllBatches(){
  cashierSelectedBatch = "";
  cashierSelectedCat = "全部";
  renderCashierBatches();
  renderCashierCatbar();
  renderCashierProducts();
}

function selectCashierBatch(id){
  cashierSelectedBatch = cashierSelectedBatch === id ? "" : id;
  cashierSelectedCat = "全部";
  renderCashierBatches();
  renderCashierCatbar();
  renderCashierProducts();
}



function firstGoodsChar(name){
  if(!name) return "";
  return String(name).trim().slice(0,1);
}

function shortCategoryLabel(cat){
  if(!cat) return "";
  if(cat === "全部") return "全";
  return String(cat).slice(0,1);
}

function renderCashierCatbar(){
  const box = document.getElementById("cashierCatbar");
  if(!box) return;

  // 右侧竖排栏按“当前可售商品名称首字”显示：
  // 商品快捷码默认取名称首字。
  const products = getCashierProducts ? getCashierProducts(true) : [];
  const letters = [];
  products.forEach(p=>{
    const ch = firstGoodsChar(p.name);
    if(ch && !letters.includes(ch)){
      letters.push(ch);
    }
  });

  const cats = ["全部", ...letters];

  if(cashierSelectedCat !== "全部" && !letters.includes(cashierSelectedCat)){
    cashierSelectedCat = "全部";
  }

  box.innerHTML = cats.map(c=>`
    <button class="cashier-cat ${cashierSelectedCat===c?'active':''}" title="${esc(c === "全部" ? "全部" : c)}" onclick="selectCashierCat('${c}')">
      ${esc(c === "全部" ? "全" : c)}
    </button>
  `).join("");
}

function selectCashierCat(cat){
  cashierSelectedCat = cat;
  renderCashierCatbar();
  renderCashierProducts();
}

function getCashierStock(goodsId){
  let qty = 0;
  let weight = 0;
  batches.forEach(b=>{
    b.items.forEach(i=>{
      if(i.goodsId === goodsId){
        const remainQty = Number(i.qty || 0) - Number(i.sold || 0);
        let soldWeight = Number(i.soldWeight || 0);
        const inWeight = Number(i.weight || 0);
        if(i.pack !== "定装" && remainQty <= 0 && inWeight > 0 && soldWeight < inWeight) soldWeight = inWeight;
        qty += remainQty;
        weight += i.pack === "定装" ? remainQty * Number(i.spec || 0) : Math.max(inWeight - soldWeight,0);
      }
    });
  });
  return {qty, weight};
}

function getCashierProducts(skipLetterFilter){
  const q = (document.getElementById("cashierProductSearch")?.value || "").toLowerCase();
  const mode = document.getElementById("cashierProductMode")?.value || "";
  const selectedBatch = batches.find(b=>b.id === cashierSelectedBatch);

  function makeGoodsFromBatchItem(b, item){
    const g = goodsMaster.find(x=>x.id === item.goodsId) || {};
    const remainQty = Math.max(Number(item.qty || 0) - Number(item.sold || 0), 0);
    const pack = item.pack || g.pack || "非定装";
    const spec = item.spec || g.spec || "";
    let soldWeight = Number(item.soldWeight || 0);
    const inWeight = Number(item.weight || g.stockWeight || 0);
    if(pack !== "定装" && remainQty <= 0 && inWeight > 0 && soldWeight < inWeight) soldWeight = inWeight;
    const remainWeight = pack === "定装"
      ? remainQty * Number(spec || 0)
      : Math.max(inWeight - soldWeight, 0);
    return {
      ...g,
      id:g.id || item.goodsId,
      goodsId:item.goodsId,
      name:g.name || item.name || item.productName || "未命名货品",
      category:g.category || item.category || "",
      pack:pack,
      spec:spec,
      unit:item.unit || g.unit || "件",
      price:Number(g.price ?? item.price ?? item.salePrice ?? item.fixedPrice ?? 0),
      stockQty:remainQty,
      stockWeight:remainWeight,
      batchItemId:item.id || item.goodsId,
      batchId:b.id,
      batchNo:b.no || b.batchNo || "-",
      batchOwner:b.owner || b.ownerName || "-",
      batchType:b.tag || b.type || b.batchType || "-",
      relatedBatch:item
    };
  }

  let products = [];
  if(selectedBatch){
    products = selectedBatch.items.map(item=>makeGoodsFromBatchItem(selectedBatch, item));
  }else{
    products = batches.flatMap(b => b.items.map(item=>makeGoodsFromBatchItem(b, item)));
  }

  if(mode) products = products.filter(g=>g.pack === mode);
  if(!skipLetterFilter && cashierSelectedCat && cashierSelectedCat !== "全部"){
    products = products.filter(g=>firstGoodsChar(g.name) === cashierSelectedCat);
  }
  if(q) products = products.filter(g=>[
    g.name,
    g.category,
    g.pack,
    g.batchNo,
    g.batchOwner,
    g.batchType
  ].join(" ").toLowerCase().includes(q));
  return products;
}

function renderCashierProducts(){
  const box = document.getElementById("cashierProducts");
  if(!box) return;
  const products = getCashierProducts();
  box.innerHTML = products.map(g=>{
    const fixed = g.pack === "定装";
    const active = currentCodeBillItems.some(i=>i.goodsId === g.id && (!g.batchNo || i.batchNo === g.batchNo));
    const hasStock = Number(g.stockQty || 0) > 0 || Number(g.stockWeight || 0) > 0;
    const stockClass = hasStock ? "in-stock" : "out-stock";
    const stockText = hasStock ? `库存：${g.stockQty}${esc(g.unit || "件")}（${g.stockWeight}斤）` : `库存：${g.stockQty}${esc(g.unit || "件")}（${g.stockWeight}斤）｜允许继续销售`;
    const batchOwner = g.batchOwner || "未标记货主";
    const batchNo = g.batchNo || "未标记批次";
    const batchType = g.batchType || "批次";
    return `
      <div class="cashier-product-card ${stockClass} ${active?'active':''}" onclick="openProductBatchPicker('${g.id}')">
        <div class="cashier-product-name">${esc(g.name)}</div>
        <div class="cashier-card-batch-info">${esc(batchOwner)}｜${esc(batchNo)}｜${esc(batchType)}</div>
        <div class="cashier-product-meta ${fixed ? "fixed" : "loose"}">${fixed ? `定装｜${esc(g.spec || 0)}斤/${esc(g.unit || "件")}｜开单填售价` : `非定装｜开单输入斤数和价钱`}</div>
        <div class="cashier-product-meta">${stockText}</div>
      </div>`;
  }).join("") || `<div class="order-empty">当前没有可售货品。<br>请先在入库模块把货品加入批次。</div>`;
}

function addProductToCodeBill(goodsId, selectedBatchId){
  const clickedProduct = getCashierProducts(true).find(x=>x.id === goodsId && (!selectedBatchId || x.batchId === selectedBatchId));
  const g = clickedProduct || goodsMaster.find(x=>x.id === goodsId);
  if(!g) return;
  const batchInfo = selectedBatchId ? {batchNo:g.batchNo, owner:g.batchOwner} : findFirstBatchForGoods(goodsId);
  const existing = currentCodeBillItems.find(i=>i.goodsId === goodsId);
  if(existing){
    existing.qty += 1;
    if(existing.pack === "定装"){
      existing.weight = Number(existing.qty || 0) * Number(existing.spec || 0);
    }
  }else{
    const fixed = g.pack === "定装";
    currentCodeBillItems.push({
      id:"billitem" + Date.now() + Math.floor(Math.random()*1000),
      goodsId:g.id,
      name:g.name,
      pack:g.pack || "非定装",
      spec:g.spec || "",
      unit:g.unit || "件",
      qty:1,
      weight:fixed ? Number(g.spec || 0) : "",
      price:Number(g.price || 0),
      fixedPrice:fixed ? Number(g.price || 0) : undefined,
      batchNo:batchInfo.batchNo,
      owner:batchInfo.owner
    });
  }
  renderCurrentCodeBill();
  renderCashierProducts();
}

function findFirstBatchForGoods(goodsId){
  for(const b of batches){
    const item = b.items.find(i=>i.goodsId === goodsId);
    if(item) return {batchNo:b.no, owner:b.owner};
  }
  return {batchNo:"-", owner:"-"};
}

function lineAmount(item){
  if(item.pack === "定装"){
    return Number(item.qty || 0) * Number(item.price || 0);
  }
  return Number(item.weight || 0) * Number(item.price || 0);
}

const cashierPaymentLabelsV121 = {
  cash:"现金",
  wechat:"微信",
  alipay:"支付宝",
  bank:"银行卡",
  debt:"赊欠"
};

function normalizeCashierPaymentMethodV121(method){
  const key = String(method || "").trim().toLowerCase();
  return cashierPaymentLabelsV121[key] ? key : "cash";
}

function setCurrentPaymentMethodV121(method){
  const next = normalizeCashierPaymentMethodV121(method);
  window.currentPaymentMethod = next;
  const pay = document.getElementById("cashierPayMode");
  if(pay){
    pay.value = next === "debt" ? "debt" : "cash";
  }
  return next;
}

function currentPaymentMethodV121(){
  return normalizeCashierPaymentMethodV121(window.currentPaymentMethod || "cash");
}

window.setCurrentPaymentMethodV121 = setCurrentPaymentMethodV121;
window.currentPaymentMethod = currentPaymentMethodV121();

function updateCodeBillItem(itemId, field, value){
  const item = currentCodeBillItems.find(i=>i.id === itemId);
  if(!item) return;
  if(item.pack === "定装"){
    if(field === "qty"){
      item.qty = Number(value || 0);
      item.weight = Number(item.qty || 0) * Number(item.spec || 0);
    }
    if(field === "price"){
      item.price = Number(value || 0);
    }
    // 定装重量只能由件数 × 固定斤数自动计算，不手动改重量。
  }else{
    if(field === "qty") item.qty = Number(value || 0);
    if(field === "weight") item.weight = value === "" ? "" : Number(value || 0);
    if(field === "price") item.price = Number(value || 0);
  }
  renderCurrentCodeBill();
}

function removeCodeBillItem(itemId){
  currentCodeBillItems = currentCodeBillItems.filter(i=>i.id !== itemId);
  renderCurrentCodeBill();
  renderCashierProducts();
}



function clearCashierDiscountFields(){
  const discountInput = document.getElementById("cashierDiscountAmount");
  if(discountInput) discountInput.value = "";
  const discountNote = document.getElementById("cashierDiscountNote");
  if(discountNote) discountNote.value = "";
}

function clearCurrentCheckoutDesk(){
  const stepSession = typeof activeSession === "function" ? activeSession() : null;
  const v116Session = typeof activeSessionV116 === "function" ? activeSessionV116() : null;
  function clearSession(session){
    if(!session) return;
    session.items = [];
    session.status = "cleared";
    session.__cartClearedV116 = true;
    delete session.__completedV116;
    delete session.__cartSavedV116;
    delete session.__restoringFromBillV116;
    delete session.__takenFromBillV116;
    delete session.sourceBillId;
  }
  currentCodeBillItems = [];
  try{ window.currentCodeBillItems = []; }catch(err){}
  try{ window.checkoutCartSnapshotV115 = []; }catch(err){}
  try{ window.__cashierCartClearedV116 = true; }catch(err){}
  clearSession(stepSession);
  if(v116Session && v116Session !== stepSession) clearSession(v116Session);
  const paidInput = document.getElementById("cashierPaidAmount");
  if(paidInput) paidInput.value = "";
  clearCashierDiscountFields();
  setCurrentPaymentMethodV121("cash");
  if(typeof renderCurrentCodeBill === "function") renderCurrentCodeBill();
  if(typeof renderCashierProducts === "function") renderCashierProducts();
  if(typeof renderCashierCustomerTabsStep1 === "function") renderCashierCustomerTabsStep1();
  if(typeof toast === "function") toast("当前下单台已清空");
}

function isTemporaryCashierCustomer(){
  const c = activeCashierCustomer();
  return !c || c.id === "c1" || c.name === "临时客户" || String(c.name || "").startsWith("临时客户");
}

function handleCustomerOrPayChange(){
  enforceTemporaryCustomerRule();
  const pay = document.getElementById("cashierPayMode");
  if(pay){
    setCurrentPaymentMethodV121(pay.value === "debt" ? "debt" : currentPaymentMethodV121());
  }
  renderCurrentCodeBill();
}

function enforceTemporaryCustomerRule(){
  const pay = document.getElementById("cashierPayMode");
  const warning = document.getElementById("tempCustomerWarning");
  if(!pay) return;

  if(isTemporaryCashierCustomer()){
    if(pay.value !== "cash"){
      pay.value = "cash";
      toast("临时客户不能赊欠，只能现金结清");
    }
    Array.from(pay.options).forEach(opt=>{
      if(opt.value === "debt" || opt.value === "mixed"){
        opt.disabled = true;
      }
    });
    if(warning) warning.classList.add("show");
  }else{
    Array.from(pay.options).forEach(opt=>opt.disabled = false);
    if(warning) warning.classList.remove("show");
  }
}

function getOrderOriginalAmount(){
  return currentCodeBillItems.reduce((sum,item)=>sum + lineAmount(item), 0);
}

function getOrderDiscountAmount(){
  const original = getOrderOriginalAmount();
  const input = document.getElementById("cashierDiscountAmount");
  const val = Math.max(Number(input ? input.value : 0) || 0, 0);
  return Math.min(val, original);
}

function codeBillTotals(){
  enforceTemporaryCustomerRule();

  const totalQty = currentCodeBillItems.reduce((s,i)=>s+Number(i.qty || 0),0);
  const totalWeight = currentCodeBillItems.reduce((s,i)=>s+Number(i.weight || 0),0);

  const originalAmount = typeof getOrderOriginalAmount === "function"
    ? getOrderOriginalAmount()
    : currentCodeBillItems.reduce((sum,item)=>sum + lineAmount(item), 0);

  const discount = typeof getOrderDiscountAmount === "function"
    ? getOrderDiscountAmount()
    : 0;

  const totalAmount = Math.max(originalAmount - discount, 0);
  const mode = document.getElementById("cashierPayMode")?.value || "cash";

  let paid = 0;
  let debt = 0;

  if(mode === "cash"){
    paid = totalAmount;
    debt = 0;
  }else if(mode === "debt"){
    paid = 0;
    debt = totalAmount;
  }else{
    paid = Math.min(Number(document.getElementById("cashierPaidAmount")?.value || 0), totalAmount);
    debt = Math.max(totalAmount - paid, 0);
  }

  // 最终兜底：临时客户必须收银，永远不能产生欠款。
  if(isTemporaryCashierCustomer()){
    paid = totalAmount;
    debt = 0;
    const pay = document.getElementById("cashierPayMode");
    if(pay) pay.value = "cash";
  }

  const discountNote = document.getElementById("cashierDiscountNote")?.value || "";

  return {totalQty,totalWeight,totalAmount,originalAmount,discount,discountNote,paid,debt};
}

function renderCurrentCodeBill(){
  const list = document.getElementById("cashierOrderList");
  if(!list) return;
  list.innerHTML = currentCodeBillItems.map(item=>{
    const fixed = item.pack === "定装";
    return `
      <div class="order-item">
        <div class="order-item-name">
          <b>${esc(item.name)}</b>
          <span>${esc(item.owner)}${esc(item.batchNo)}｜${fixed ? `定装 ${item.spec}斤/${esc(item.unit)}｜销售价可填` : "非定装"}</span>
        </div>
        <div>
          <input type="number" min="0" step="1" value="${item.qty}" onchange="updateCodeBillItem('${item.id}','qty',this.value)">
          <small>${esc(item.unit)}</small>
        </div>
        <div>
          <input type="number" min="0" step="0.01" value="${item.price}" onchange="updateCodeBillItem('${item.id}','price',this.value)">
          <small>${fixed ? "销售件价 元/件" : "销售斤价 元/斤"}</small>
        </div>
        <div class="order-money">${money(lineAmount(item))}</div>
        <button class="order-del" onclick="removeCodeBillItem('${item.id}')">删</button>
        ${fixed ? "" : `<div></div><div><input type="number" min="0" step="0.01" value="${item.weight}" placeholder="斤数" onchange="updateCodeBillItem('${item.id}','weight',this.value)"><small>斤</small></div><div></div><div></div><div></div>`}
      </div>
    `;
  }).join("") || `<div class="order-empty">点击左侧商品加入订单。<br>定装只改件数；非定装输入斤数和价钱。</div>`;

  const t = codeBillTotals();
  document.getElementById("orderTotalQty").textContent = t.totalQty;
  document.getElementById("orderTotalWeight").textContent = t.totalWeight + "斤";
  const originalEl = document.getElementById("orderOriginalAmount");
  const discountEl = document.getElementById("orderDiscountAmount");
  if(originalEl) originalEl.textContent = money(t.originalAmount || 0);
  if(discountEl) discountEl.textContent = money(t.discount || 0);
  document.getElementById("orderTotalAmount").textContent = money(t.totalAmount);
}

function orderPaymentLabelV121(order){
  const method = normalizeCashierPaymentMethodV121(order && (order.paymentMethod || order.paymentMethodLabel || order.payment || order.payMethod));
  if(order && order.paymentMethodLabel) return order.paymentMethodLabel;
  if(order && order.paymentLabel) return order.paymentLabel;
  if(method === "debt") return "赊欠";
  if(Number(order && (order.debtAmount || order.debt || 0)) > 0 && !order?.paymentMethod) return "赊欠";
  return cashierPaymentLabelsV121[method] || "现金";
}

function makeShortCodeBillNo(){
  const no = String(shortCodeBillCounter).padStart(4, "0");
  shortCodeBillCounter += 1;
  return no;
}

function makeShortOrderNo(){
  const no = String(shortOrderCounter).padStart(4, "0");
  shortOrderCounter += 1;
  return no;
}

function buildCodeBill(rowsForBill){
  const sourceRows = Array.isArray(rowsForBill) ? rowsForBill : currentCodeBillItems;
  const rows = sourceRows.map(item=>Object.assign({}, item));
  const customer = activeCashierCustomer();
  const totalQty = rows.reduce((s,i)=>s+Number(i.qty || 0),0);
  const totalWeight = rows.reduce((s,i)=>s+Number(i.weight || 0),0);
  const originalAmount = rows.reduce((sum,item)=>sum + lineAmount(item), 0);
  const discount = typeof getOrderDiscountAmount === "function"
    ? getOrderDiscountAmount()
    : 0;
  const totalAmount = Math.max(originalAmount - discount, 0);
  const mode = document.getElementById("cashierPayMode")?.value || "cash";
  let paid = 0;
  let debt = 0;
  if(mode === "cash"){
    paid = totalAmount;
    debt = 0;
  }else if(mode === "debt"){
    paid = 0;
    debt = totalAmount;
  }else{
    paid = Math.min(Number(document.getElementById("cashierPaidAmount")?.value || 0), totalAmount);
    debt = Math.max(totalAmount - paid, 0);
  }
  if(isTemporaryCashierCustomer()){
    paid = totalAmount;
    debt = 0;
    const pay = document.getElementById("cashierPayMode");
    if(pay) pay.value = "cash";
  }
  const discountNote = document.getElementById("cashierDiscountNote")?.value || "";
  const paymentMethod = currentPaymentMethodV121();
  const totals = {totalQty,totalWeight,totalAmount,originalAmount,discount,discountNote,paid,debt};
  const time = new Date().toLocaleString("zh-CN",{hour12:false});
  const billNo = makeShortCodeBillNo();
  const lines = rows.map((i,idx)=>({
    index:idx+1,
    name:i.name,
    owner:i.owner,
    batchNo:i.batchNo,
    type:i.pack,
    qty:Number(i.qty || 0),
    unit:i.unit || "件",
    weight:Number(i.weight || 0),
    price:Number(i.price || 0),
    amount:lineAmount(i)
  }));
  const text = [
    "仓頡码单",
    "码单号：" + billNo,
    "客户：" + customer.name,
    "时间：" + time,
    "----------------",
    ...lines.map(i=>`${i.index}. ${i.name}｜${i.owner}${i.batchNo}｜${i.type}｜${i.qty}${i.unit}｜${i.weight}斤｜${money(i.price)}元/${i.type==="定装"?"件":"斤"}｜${money(i.amount)}`),
    "----------------",
    "总数量：" + totals.totalQty,
    "总重量：" + totals.totalWeight + "斤",
    "原金额：" + money(totals.originalAmount || totals.totalAmount),
    "优惠：" + money(totals.discount || 0) + (totals.discountNote ? "（" + totals.discountNote + "）" : ""),
    "应收金额：" + money(totals.totalAmount),
    "实收：" + money(totals.paid),
    "欠款：" + money(totals.debt)
  ].join("\n");
  return {billNo, customerName:customer.name, customerId:customer.id, time, lines, ...totals, text, status:"未下单"};
}

function openCodeBillModal(){
  if(!currentCodeBillItems.length){
    alert("请先选择商品，再开码单。");
    return;
  }

  const bill = buildCodeBill();
  bill.status = "saved";
  bill.displayStatus = "已开码单";
  bill.__savedV116 = true;
  bill.__savedV116 = true;

  savedCodeBills.unshift(bill);
  selectedBillCenterId = bill.billNo;

  // 开码单后，单子直接进入码单中心；当前收银台清空，准备下一单。
  currentCodeBillItems = [];
  try{
    window.currentCodeBillItems = [];
    window.checkoutCartSnapshotV115 = [];
    window.__cashierCartClearedV116 = true;
    const sessions = Array.isArray(window.cashierBillSessionsStep1) ? window.cashierBillSessionsStep1 : [];
    const activeBtn = document.querySelector('#cashierRoot .order-tab.active[data-bill-session]');
    const activeId = activeBtn ? activeBtn.getAttribute('data-bill-session') : '';
    const matchedSession = sessions.find(function(s){ return s && s.id === activeId; }) || sessions[0] || null;
    if(matchedSession){
      matchedSession.items = [];
      matchedSession.status = "clearedAfterSave";
      matchedSession.__cartClearedV116 = true;
      matchedSession.__cartSavedV116 = bill.billNo || true;
      delete matchedSession.__completedV116;
      delete matchedSession.__restoringFromBillV116;
      delete matchedSession.__takenFromBillV116;
    }
  }catch(err){}
  try{ window.currentCodeBillItems = []; }catch(err){}
  try{ window.checkoutCartSnapshotV115 = []; }catch(err){}
  try{ window.__cashierCartClearedV116 = true; }catch(err){}
  try{
    var sessionRowsCodeBill = Array.isArray(window.cashierBillSessionsStep1) ? window.cashierBillSessionsStep1 : [];
    if(sessionRowsCodeBill.length){
      var activeTabCodeBill = document.querySelector('#cashierRoot .order-tab.active[data-bill-session]');
      var activeSessionIdCodeBill = activeTabCodeBill ? activeTabCodeBill.getAttribute('data-bill-session') : '';
      var matchedSessionCodeBill = sessionRowsCodeBill.find(function(session){
        return session && session.id === activeSessionIdCodeBill;
      }) || sessionRowsCodeBill[0];
      if(matchedSessionCodeBill){
        matchedSessionCodeBill.items = [];
        matchedSessionCodeBill.__cartClearedV116 = true;
        matchedSessionCodeBill.__cartSavedV116 = true;
      }
    }
  }catch(err){}
  const paidInput = document.getElementById("cashierPaidAmount");
  if(paidInput) paidInput.value = "";
  clearCashierDiscountFields();
  const discountInput = document.getElementById("cashierDiscountAmount");
  if(discountInput) discountInput.value = "";
  const discountNote = document.getElementById("cashierDiscountNote");
  if(discountNote) discountNote.value = "";

  clearCashierDiscountFields();
  renderCurrentCodeBill();
  renderCashierProducts();
  renderBillCenter();
  renderCodeBillHistory();
  renderOrdersCenter();

  // 不再弹出码单服务窗口。
  toast("码单 " + bill.billNo + " 已进入码单中心");
}

function closeCodeBillModal(){
  document.getElementById("codeBillModal")?.classList.remove("show");
}

function renderCodeBillModal(existingBill){
  const bill = existingBill || buildCodeBill();
  document.getElementById("codeBillCustomer").textContent = bill.customerName;
  document.getElementById("codeBillKinds").textContent = bill.lines.length;
  document.getElementById("codeBillQty").textContent = bill.totalQty;
  document.getElementById("codeBillWeight").textContent = bill.totalWeight + "斤";
  document.getElementById("codeBillAmount").textContent = money(bill.totalAmount);
  document.getElementById("codeBillPaid").textContent = money(bill.paid);
  document.getElementById("codeBillDebt").textContent = money(bill.debt);
  document.getElementById("codeBillBody").innerHTML = bill.lines.map(i=>`
    <tr>
      <td>${i.index}</td>
      <td>${esc(i.name)}</td>
      <td>${esc(i.owner)}${esc(i.batchNo)}</td>
      <td>${esc(i.type)}</td>
      <td>${i.qty}${esc(i.unit)}</td>
      <td>${i.weight}斤</td>
      <td>${money(i.price)} / ${i.type === "定装" ? "件" : "斤"}</td>
      <td>${money(i.amount)}</td>
    </tr>
  `).join("");
  document.getElementById("codeBillText").value = bill.text;
  renderCodeBillHistory();
  renderBillCenter();
}

function saveCodeBill(){
  if(!currentCodeBillItems.length){
    toast("当前没有可保存的开单商品");
    return;
  }
  openCodeBillModal();
}

function copyCodeBill(){
  const text = document.getElementById("codeBillText").value;
  if(!text){
    alert("暂无可复制码单。");
    return;
  }
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(()=>toast("码单已复制"));
  }else{
    const area = document.getElementById("codeBillText");
    area.focus();
    area.select();
    document.execCommand("copy");
    toast("码单已复制");
  }
}

function renderCodeBillHistory(){
  const box = document.getElementById("codeBillHistory");
  if(!box) return;
  if(!savedCodeBills.length){
    box.textContent = "暂无保存码单";
    return;
  }
  box.innerHTML = savedCodeBills.slice(0,5).map(b=>`
    <div>${esc(b.time)}｜${esc(b.customerName)}｜${b.lines.length}种｜${b.totalWeight}斤｜${money(b.totalAmount)}｜${esc(b.status)}</div>
  `).join("");
}

function confirmOrderFromCodeBill(){
  if(!currentCodeBillItems.length){
    alert("请先选择商品。");
    return;
  }
  const bill = buildCodeBill();
  const customer = cashierCustomers.find(c=>c.id === bill.customerId);
  if(isTemporaryCashierCustomer()){
    bill.paid = Number(bill.totalAmount || 0);
    bill.debt = 0;
    bill.status = "已收银";
  }
  if(customer && !isTemporaryCashierCustomer()) customer.debt = Number(customer.debt || 0) + Number(bill.debt || 0);

  // 下单后才同步销量：允许库存不足继续成交。
  currentCodeBillItems.forEach(line=>{
    let need = Number(line.qty || 0);
    for(const batch of batches){
      for(const item of batch.items){
        if(item.goodsId === line.goodsId && need > 0){
          const available = Number(item.qty || 0) - Number(item.sold || 0);
          const take = Math.min(Math.max(available,0), need);
          item.sold = Number(item.sold || 0) + take;
          need -= take;
        }
      }
    }
  });

  bill.status = "已下单";
  finalOrders.unshift(bill);
  removePendingDuplicateOrders(bill);
  savedCodeBills.unshift(bill);
  selectedBillCenterId = bill.billNo;
  currentCodeBillItems = [];
  document.getElementById("cashierPaidAmount").value = "";
  closeCodeBillModal();
  renderCashierAll();
  renderGoods();
  renderDetail();
  toast("下单完成：订单、客户欠款、销量已同步");
}


function openBillCenter(){
  renderBillCenter();
  document.getElementById("billCenterModal").classList.add("show");
}

function closeBillCenter(){
  document.getElementById("billCenterModal")?.classList.remove("show");
}

function renderBillCenter(){
  const listBox = document.getElementById("billCenterList");
  const detailBox = document.getElementById("billCenterDetail");
  if(!listBox || !detailBox) return;

  if(!savedCodeBills.length){
    listBox.innerHTML = `<div class="order-empty">暂无码单。<br>在收银页点击“开码单”后，会自动保存到这里。</div>`;
    detailBox.innerHTML = `<div class="bill-detail-empty">暂无码单明细</div>`;
    return;
  }

  if(!selectedBillCenterId || !savedCodeBills.some(b=>b.billNo === selectedBillCenterId)){
    selectedBillCenterId = savedCodeBills[0].billNo;
  }

  listBox.innerHTML = savedCodeBills.map(b=>`
    <div class="bill-card ${b.billNo===selectedBillCenterId?'active':''}" onclick="selectBillCenter('${b.billNo}')">
      <b>${esc(b.billNo)}</b>
      <span>客户：${esc(b.customerName)}</span>
      <span>时间：${esc(b.time)}</span>
      <span>${b.lines.length}种｜${b.totalWeight}斤｜${money(b.totalAmount)}｜${esc(b.status || "已开码单")}</span>
    </div>
  `).join("");

  const bill = savedCodeBills.find(b=>b.billNo === selectedBillCenterId);
  renderBillCenterDetail(bill);
}

function selectBillCenter(billNo){
  selectedBillCenterId = billNo;
  renderBillCenter();
}

function renderBillCenterDetail(bill){
  const box = document.getElementById("billCenterDetail");
  if(!box) return;
  if(!bill){
    box.innerHTML = `<div class="bill-detail-empty">请选择左侧码单</div>`;
    return;
  }

  box.innerHTML = `
    <div class="bill-detail-top">
      <div class="bill-info"><span>码单号</span><b>${esc(bill.billNo)}</b></div>
      <div class="bill-info"><span>客户</span><b>${esc(bill.customerName)}</b></div>
      <div class="bill-info"><span>总重量</span><b>${bill.totalWeight}斤</b></div>
      <div class="bill-info"><span>合计金额</span><b>${money(bill.totalAmount)}</b></div>
    </div>

    <div class="bill-detail-table-wrap">
      <table class="bill-detail-table">
        <thead>
          <tr>
            <th>序号</th>
            <th>货品</th>
            <th>批次</th>
            <th>类型</th>
            <th>数量</th>
            <th>重量</th>
            <th>单价</th>
            <th>金额</th>
          </tr>
        </thead>
        <tbody>
          ${bill.lines.map(i=>`
            <tr>
              <td>${i.index}</td>
              <td>${esc(i.name)}</td>
              <td>${esc(i.owner)}${esc(i.batchNo)}</td>
              <td>${esc(i.type)}</td>
              <td>${i.qty}${esc(i.unit)}</td>
              <td>${i.weight}斤</td>
              <td>${money(i.price)} / ${i.type === "定装" ? "件" : "斤"}</td>
              <td>${money(i.amount)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>

    <div class="bill-center-actions">
      <button class="bill-order-btn" onclick="takeSavedBill('${bill.billNo}')">取单</button>
      <button class="bill-delete-btn" onclick="deleteSavedBill('${bill.billNo}')">删除码单</button>
    </div>

    <textarea class="bill-textarea" readonly>${esc(bill.text)}</textarea>
  `;
  setTimeout(patchBatchDetailSaleButtonsStep1, 0);
}

function copySavedBill(billNo){
  const bill = savedCodeBills.find(b=>b.billNo === billNo);
  if(!bill) return;
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(bill.text).then(()=>toast("码单已复制"));
  }else{
    const area = document.querySelector(".bill-textarea");
    area.focus();
    area.select();
    document.execCommand("copy");
    toast("码单已复制");
  }
}

function deleteSavedBill(billNo){
  if(!confirm("确定删除这张码单吗？")) return;
  savedCodeBills = savedCodeBills.filter(b=>b.billNo !== billNo);
  if(selectedBillCenterId === billNo) selectedBillCenterId = "";
  renderBillCenter();
  renderCodeBillHistory();
  renderOrdersCenter();
  toast("码单已删除");
}

function convertSavedBillToOrder(billNo){
  const bill = savedCodeBills.find(b=>b.billNo === billNo);
  if(!bill) return;
  bill.status = "已下单";
  finalOrders.unshift(bill);
  removePendingDuplicateOrders(bill);
  renderBillCenter();
  renderCodeBillHistory();
  renderOrdersCenter();
  toast("码单已取单");
}

function renderCashierAll(){
  renderCashierCustomers();
  renderCashierBatches();
  renderCashierCatbar();
  renderCashierProducts();
  enforceTemporaryCustomerRule();
  enforceTemporaryCustomerRule();
  renderCurrentCodeBill();
  renderCodeBillHistory();
}


/* ===== V12：码单中心转订单结算流程 ===== */
var pendingSettleBillNo = "";
var pendingSettleMode = "cash";

function chooseSettleMode(mode){
  pendingSettleMode = mode === "debt" ? "debt" : "cash";
  const cash = document.getElementById("settleCashOption");
  const debt = document.getElementById("settleDebtOption");
  if(cash) cash.classList.toggle("active", pendingSettleMode === "cash");
  if(debt) debt.classList.toggle("active", pendingSettleMode === "debt");
}

function openSettleOrderModal(billNo){
  const bill = savedCodeBills.find(b=>b.billNo === billNo);
  if(!bill) return;

  pendingSettleBillNo = billNo;
  pendingSettleMode = "cash";
  chooseSettleMode("cash");

  const info = document.getElementById("settleOrderInfo");
  if(info){
    info.innerHTML = `
      <div>码单号：${esc(bill.billNo)}</div>
      <div>客户：${esc(bill.customerName)}</div>
      <div>合计金额：${money(bill.totalAmount)}</div>
      <div>货品：${bill.lines.length} 种，总重量 ${bill.totalWeight}斤</div>
    `;
  }

  document.getElementById("settleOrderModal")?.classList.add("show");
}

function closeSettleOrderModal(){
  document.getElementById("settleOrderModal")?.classList.remove("show");
}

function convertSavedBillToOrder(billNo){
  openSettleOrderModal(billNo);
}

function completeSettleOrder(){
  const bill = savedCodeBills.find(b=>b.billNo === pendingSettleBillNo);
  if(!bill){
    closeSettleOrderModal();
    return;
  }

  bill.status = pendingSettleMode === "cash" ? "已收银" : "已赊欠";
  bill.orderNo = typeof makeShortOrderNo === "function" ? makeShortOrderNo() : String(finalOrders.length + 1).padStart(4, "0");
  bill.paid = pendingSettleMode === "cash" ? Number(bill.totalAmount || 0) : 0;
  bill.debt = pendingSettleMode === "debt" ? Number(bill.totalAmount || 0) : 0;

  const customer = cashierCustomers.find(c=>c.id === bill.customerId);
  if(customer && pendingSettleMode === "debt"){
    customer.debt = Number(customer.debt || 0) + Number(bill.totalAmount || 0);
  }

  finalOrders.unshift(bill);
  removePendingDuplicateOrders(bill);

  // 完成后，码单生命周期结束，从码单中心移除
  savedCodeBills = savedCodeBills.filter(b=>b.billNo !== pendingSettleBillNo);
  selectedBillCenterId = savedCodeBills[0]?.billNo || "";
  pendingSettleBillNo = "";

  clearCashierDiscountFields();
  closeSettleOrderModal();
  closeBillCenter();
  closeCodeBillModal();

  // 回到开单界面，准备下一单
  showAppPage("cashier");
  renderCashierAll();
  renderBillCenter();
  renderCodeBillHistory();
  renderOrdersCenter();

  toast("订单 " + bill.orderNo + " 已完成：" + (pendingSettleMode === "cash" ? "现金收银" : "赊欠记账"));
}


/* ===== V15：码单中心取单流程 ===== */
function takeSavedBill(billNo){
  const bill = savedCodeBills.find(b=>b.billNo === billNo);
  if(!bill) return;
  bill.__restoringFromBillV116 = true;
  bill.__takenV116 = true;

  currentCodeBillItems = bill.lines.map(line=>{
    const goods = goodsMaster.find(g=>g.name === line.name);
    const fixed = line.type === "定装";
    return {
      id:"take" + Date.now() + Math.floor(Math.random()*1000) + line.index,
      goodsId: goods ? goods.id : ("goods_" + line.index),
      name: line.name,
      pack: line.type,
      spec: goods ? (goods.spec || "") : "",
      unit: line.unit || "件",
      qty: Number(line.qty || 0),
      weight: Number(line.weight || 0),
      price: Number(line.price || 0),
      fixedPrice: fixed ? Number(line.price || 0) : undefined,
      batchNo: line.batchNo || "-",
      owner: line.owner || "-"
    };
  });
  try{ window.currentCodeBillItems = currentCodeBillItems; }catch(err){}
  try{ window.checkoutCartSnapshotV115 = []; }catch(err){}
  try{ window.__cashierCartClearedV116 = false; }catch(err){}
  try{
    var sessionRowsTaken = Array.isArray(window.cashierBillSessionsStep1) ? window.cashierBillSessionsStep1 : [];
    if(sessionRowsTaken.length){
      var activeTabTaken = document.querySelector('#cashierRoot .order-tab.active[data-bill-session]');
      var activeSessionIdTaken = activeTabTaken ? activeTabTaken.getAttribute('data-bill-session') : '';
      var matchedSessionTaken = sessionRowsTaken.find(function(session){
        return session && session.id === activeSessionIdTaken;
      }) || sessionRowsTaken[0];
      if(matchedSessionTaken){
        matchedSessionTaken.items = currentCodeBillItems;
        matchedSessionTaken.customerId = bill.customerId;
        matchedSessionTaken.name = bill.customerName;
        delete matchedSessionTaken.__cartClearedV116;
        delete matchedSessionTaken.__completedV116;
        delete matchedSessionTaken.__cartSavedV116;
        matchedSessionTaken.__restoringFromBillV116 = true;
        matchedSessionTaken.__takenFromBillV116 = bill.billNo;
      }
    }
  }catch(err){}

  // 从码单中心取出后，该码单从码单中心移除，回到当前收银台。
  savedCodeBills = savedCodeBills.filter(b=>b.billNo !== billNo);
  selectedBillCenterId = savedCodeBills[0]?.billNo || "";

  const customer = cashierCustomers.find(c=>c.id === bill.customerId);
  if(customer){
    const customerSelect = document.getElementById("cashierCustomer");
    if(customerSelect) customerSelect.value = customer.id;
  }

  const paidInput = document.getElementById("cashierPaidAmount");
  if(paidInput) paidInput.value = "";
  const discountInput = document.getElementById("cashierDiscountAmount");
  if(discountInput) discountInput.value = bill.discount ? String(bill.discount) : "";
  const discountNote = document.getElementById("cashierDiscountNote");
  if(discountNote) discountNote.value = bill.discountNote || "";

  closeBillCenter();
  closeCodeBillModal();
  showAppPage("cashier");
  enforceTemporaryCustomerRule();
  renderCashierAll();
  toast(isTemporaryCashierCustomer() ? "已取出码单 " + bill.billNo + "，临时客户只能收银" : "已取出码单 " + bill.billNo + "，请在收银台选择收银或赊欠后下单");
}

// 原来的取单入口不再直接结算，改为取单。
function convertSavedBillToOrder(billNo){
  takeSavedBill(billNo);
}


/* ===== V16：临时客户强制只能收银，正式买家才可赊欠 ===== */

function clearCashierDiscountFields(){
  const discountInput = document.getElementById("cashierDiscountAmount");
  if(discountInput) discountInput.value = "";
  const discountNote = document.getElementById("cashierDiscountNote");
  if(discountNote) discountNote.value = "";
}

function isTemporaryCashierCustomer(){
  const c = activeCashierCustomer ? activeCashierCustomer() : null;
  return !c || c.id === "c1" || c.name === "临时客户" || String(c.name || "").startsWith("临时客户");
}

function handleCustomerOrPayChange(){
  enforceTemporaryCustomerRule();
  renderCurrentCodeBill();
}

function enforceTemporaryCustomerRule(){
  const pay = document.getElementById("cashierPayMode");
  const warning1 = document.getElementById("tempCustomerWarning");
  const warning2 = document.getElementById("tempCustomerStrictWarning");
  if(!pay) return;

  const isTemp = isTemporaryCashierCustomer();

  if(isTemp){
    // 临时客户绝对不能赊欠/部分收款，必须现金结清。
    if(pay.value !== "cash"){
      pay.value = "cash";
      toast("临时客户不能赊欠，只能收银");
    }
    Array.from(pay.options).forEach(opt=>{
      if(opt.value === "debt" || opt.value === "mixed"){
        opt.disabled = true;
      }
    });
    if(warning1) warning1.classList.add("show");
    if(warning2) warning2.style.display = "block";
  }else{
    // 正式买家可以现金、赊欠、部分收款。
    Array.from(pay.options).forEach(opt=>opt.disabled = false);
    if(warning1) warning1.classList.remove("show");
    if(warning2) warning2.style.display = "none";
  }
}


/* ===== V20：订单模块 ===== */
var selectedOrderCenterId = "";

function normalizeOrderType(order){
  if(!order) return "待处理";
  if(order.voided || order.status === "已作废" || order.displayStatus === "已作废") return "已作废";
  if(order.status === "已收银") return "已收银";
  if(order.status === "已赊欠") return "已赊欠";
  if(order.status === "已下单" && Number(order.debt || 0) > 0) return "已赊欠";
  if(order.status === "已下单") return "已收银";
  if(order.status === "待处理" || order.status === "待处理订单" || order.status === "码单" || order.status === "已开码单"){
    return "待处理";
  }
  if(Number(order.debt || 0) > 0) return "已赊欠";
  return "待处理";
}



function removePendingDuplicateOrders(doneBill){
  if(!doneBill) return;
  const key = doneBill.orderNo || doneBill.billNo;
  finalOrders = (finalOrders || []).filter(o=>{
    const ok = o.orderNo || o.billNo;
    if(ok !== key) return true;
    return normalizeOrderType(o) === "已收银" || normalizeOrderType(o) === "已赊欠";
  });
}

function allOrderRecords(){
  // 订单中心只显示已经完成的订单：
  // 已收银 / 已赊欠。
  // 待处理订单属于码单/未完成状态，不进入订单中心。
  const raw = (finalOrders || []).filter(o=>{
    const st = normalizeOrderType(o);
    return st === "已收银" || st === "已赊欠";
  });

  const map = new Map();
  raw.forEach(o=>{
    const key = o.orderNo || o.billNo;
    map.set(key, {
      ...o,
      recordSource:"订单",
      displayStatus:normalizeOrderType(o),
      centerId:"order_" + key
    });
  });

  return Array.from(map.values()).sort((a,b)=>String(b.time || "").localeCompare(String(a.time || "")));
}

function showAppPage(page){
  if(page === "cashier"){
    document.body.classList.remove("show-inbound");
    document.body.classList.add("show-cashier");
    renderCashierAll();
  }else{
    document.body.classList.remove("show-cashier");
    document.body.classList.add("show-inbound");
    renderAll();
  }
}

function activeCashierCustomer(){
  const id = document.getElementById("cashierCustomer")?.value;
  return cashierCustomers.find(c=>c.id === id) || cashierCustomers[0];
}

function addCashierCustomer(){
  const name = prompt("请输入买家名称：");
  if(!name) return;
  const clean = name.trim();
  if(!clean) return;
  const c = {id:"c" + Date.now(), name:clean, debt:0};
  cashierCustomers.push(c);
  renderCashierCustomers();
  document.getElementById("cashierCustomer").value = c.id;
  renderCurrentCodeBill();
  toast("买家已新增");
}

function renderCashierCustomers(){
  const sel = document.getElementById("cashierCustomer");
  if(!sel) return;
  const old = sel.value;
  sel.innerHTML = cashierCustomers.map(c=>`<option value="${c.id}">${esc(c.name)}${c.debt>0 ? "｜欠" + money(c.debt) : ""}</option>`).join("");
  if(old) sel.value = old;
}

function renderCashierBatches(){
  const box = document.getElementById("cashierBatchList");
  if(!box) return;
  const cards = batches.map(b=>`
    <div class="cashier-batch-card ${cashierSelectedBatch===b.id?'active':''}" onclick="selectCashierBatch('${b.id}')">
      <b>${esc(b.owner)}</b>
      <span>${esc(b.no)}｜${esc(b.tag)}</span>
    </div>
  `).join("");
  box.innerHTML = cards;
}

function selectCashierBatch(id){
  cashierSelectedBatch = cashierSelectedBatch === id ? "" : id;
  renderCashierBatches();
  renderCashierProducts();
}



function firstGoodsChar(name){
  if(!name) return "";
  return String(name).trim().slice(0,1);
}

function shortCategoryLabel(cat){
  if(!cat) return "";
  if(cat === "全部") return "全";
  return String(cat).slice(0,1);
}

function renderCashierCatbar(){
  const box = document.getElementById("cashierCatbar");
  if(!box) return;

  // 右侧竖排栏按“当前可售商品名称首字”显示：
  // 商品快捷码默认取名称首字。
  const products = getCashierProducts ? getCashierProducts(true) : [];
  const letters = [];
  products.forEach(p=>{
    const ch = firstGoodsChar(p.name);
    if(ch && !letters.includes(ch)){
      letters.push(ch);
    }
  });

  const cats = ["全部", ...letters];

  if(cashierSelectedCat !== "全部" && !letters.includes(cashierSelectedCat)){
    cashierSelectedCat = "全部";
  }

  box.innerHTML = cats.map(c=>`
    <button class="cashier-cat ${cashierSelectedCat===c?'active':''}" title="${esc(c === "全部" ? "全部" : c)}" onclick="selectCashierCat('${c}')">
      ${esc(c === "全部" ? "全" : c)}
    </button>
  `).join("");
}

function selectCashierCat(cat){
  cashierSelectedCat = cat;
  renderCashierCatbar();
  renderCashierProducts();
}

function getCashierStock(goodsId){
  let qty = 0;
  let weight = 0;
  batches.forEach(b=>{
    b.items.forEach(i=>{
      if(i.goodsId === goodsId){
        const remainQty = Number(i.qty || 0) - Number(i.sold || 0);
        qty += remainQty;
        weight += i.pack === "定装" ? remainQty * Number(i.spec || 0) : Math.max(Number(i.weight || 0),0);
      }
    });
  });
  return {qty, weight};
}

function getCashierProducts(skipLetterFilter){
  const q = (document.getElementById("cashierProductSearch")?.value || "").toLowerCase();
  const mode = document.getElementById("cashierProductMode")?.value || "";
  const selectedBatch = batches.find(b=>b.id === cashierSelectedBatch);

  // 收银只显示已经入过库/出现在批次明细里的货品。
  // 纯商品档案里有、但从未入库的货品，不在收银界面显示。
  const stockedGoodsIds = new Set();
  batches.forEach(b=>{ b.items.forEach(i=>stockedGoodsIds.add(i.goodsId)); });

  let products = goodsMaster.filter(g=>stockedGoodsIds.has(g.id)).map(g=>{
    const stock = getCashierStock(g.id);
    const relatedBatch = selectedBatch ? selectedBatch.items.find(i=>i.goodsId === g.id) : batches.flatMap(b=>b.items.map(i=>({...i, batchNo:b.no, owner:b.owner}))).find(i=>i.goodsId === g.id);
    return {...g, stockQty:stock.qty, stockWeight:stock.weight, relatedBatch};
  });

  if(selectedBatch){ const ids = new Set(selectedBatch.items.map(i=>i.goodsId)); products = products.filter(g=>ids.has(g.id)); }
  if(mode) products = products.filter(g=>g.pack === mode);
  if(!skipLetterFilter && cashierSelectedCat && cashierSelectedCat !== "全部"){
    products = products.filter(g=>firstGoodsChar(g.name) === cashierSelectedCat);
  }
  if(q) products = products.filter(g=>[g.name,g.category,g.pack].join(" ").toLowerCase().includes(q));
  return products;
}

function renderCashierProducts(){
  const box = document.getElementById("cashierProducts");
  if(!box) return;
  const products = getCashierProducts();
  box.innerHTML = products.map(g=>{
    const fixed = g.pack === "定装";
    const active = currentCodeBillItems.some(i=>i.goodsId === g.id);
    const hasStock = Number(g.stockQty || 0) > 0;
    const stockClass = hasStock ? "in-stock" : "out-stock";
    const stockText = hasStock ? `库存：${g.stockQty}${esc(g.unit || "件")}（${g.stockWeight}斤）` : `库存：${g.stockQty}${esc(g.unit || "件")}（${g.stockWeight}斤）｜允许继续销售`;
    return `
      <div class="cashier-product-card ${stockClass} ${active?'active':''}" onclick="openProductBatchPicker('${g.id}')">
        <div class="cashier-product-name">${esc(g.name)}</div>
        <div class="cashier-product-meta ${fixed ? "fixed" : "loose"}">${fixed ? `定装｜${esc(g.spec || 0)}斤/${esc(g.unit || "件")}｜开单填售价` : `非定装｜开单输入斤数和价钱`}</div>
        <div class="cashier-product-meta">${stockText}</div>
      </div>`;
  }).join("") || `<div class="order-empty">当前没有可售货品。<br>请先在入库模块把货品加入批次。</div>`;
}

function addProductToCodeBill(goodsId){
  const g = goodsMaster.find(x=>x.id === goodsId);
  if(!g){
    return;
  }
  const batchInfo = findFirstBatchForGoods(goodsId);
  const existing = currentCodeBillItems.find(i=>i.goodsId === goodsId);
  if(existing){
    existing.qty += 1;
    if(existing.pack === "定装"){
      existing.weight = Number(existing.qty || 0) * Number(existing.spec || 0);
    }
  }else{
    const fixed = g.pack === "定装";
    currentCodeBillItems.push({
      id:"billitem" + Date.now() + Math.floor(Math.random()*1000),
      goodsId:g.id,
      name:g.name,
      pack:g.pack || "非定装",
      spec:g.spec || "",
      unit:g.unit || "件",
      qty:1,
      weight:fixed ? Number(g.spec || 0) : "",
      price:Number(g.price || 0),
      fixedPrice:fixed ? Number(g.price || 0) : undefined,
      batchNo:batchInfo.batchNo,
      owner:batchInfo.owner
    });
  }
  renderCurrentCodeBill();
  renderCashierProducts();
}

function findFirstBatchForGoods(goodsId){
  for(const b of batches){
    const item = b.items.find(i=>i.goodsId === goodsId);
    if(item) return {batchNo:b.no, owner:b.owner};
  }
  return {batchNo:"-", owner:"-"};
}

function lineAmount(item){
  if(item.pack === "定装"){
    return Number(item.qty || 0) * Number(item.price || 0);
  }
  return Number(item.weight || 0) * Number(item.price || 0);
}

function updateCodeBillItem(itemId, field, value){
  const item = currentCodeBillItems.find(i=>i.id === itemId);
  if(!item) return;
  if(item.pack === "定装"){
    if(field === "qty"){
      item.qty = Number(value || 0);
      item.weight = Number(item.qty || 0) * Number(item.spec || 0);
    }
    if(field === "price"){
      item.price = Number(value || 0);
    }
    // 定装重量只能由件数 × 固定斤数自动计算，不手动改重量。
  }else{
    if(field === "qty") item.qty = Number(value || 0);
    if(field === "weight") item.weight = value === "" ? "" : Number(value || 0);
    if(field === "price") item.price = Number(value || 0);
  }
  renderCurrentCodeBill();
}

function removeCodeBillItem(itemId){
  currentCodeBillItems = currentCodeBillItems.filter(i=>i.id !== itemId);
  renderCurrentCodeBill();
  renderCashierProducts();
}



function clearCashierDiscountFields(){
  const discountInput = document.getElementById("cashierDiscountAmount");
  if(discountInput) discountInput.value = "";
  const discountNote = document.getElementById("cashierDiscountNote");
  if(discountNote) discountNote.value = "";
}

function isTemporaryCashierCustomer(){
  const c = activeCashierCustomer();
  return !c || c.id === "c1" || c.name === "临时客户" || String(c.name || "").startsWith("临时客户");
}

function handleCustomerOrPayChange(){
  enforceTemporaryCustomerRule();
  renderCurrentCodeBill();
}

function enforceTemporaryCustomerRule(){
  const pay = document.getElementById("cashierPayMode");
  const warning = document.getElementById("tempCustomerWarning");
  if(!pay) return;

  if(isTemporaryCashierCustomer()){
    if(pay.value !== "cash"){
      pay.value = "cash";
      toast("临时客户不能赊欠，只能现金结清");
    }
    Array.from(pay.options).forEach(opt=>{
      if(opt.value === "debt" || opt.value === "mixed"){
        opt.disabled = true;
      }
    });
    if(warning) warning.classList.add("show");
  }else{
    Array.from(pay.options).forEach(opt=>opt.disabled = false);
    if(warning) warning.classList.remove("show");
  }
}

function getOrderOriginalAmount(){
  return currentCodeBillItems.reduce((sum,item)=>sum + lineAmount(item), 0);
}

function getOrderDiscountAmount(){
  const original = getOrderOriginalAmount();
  const input = document.getElementById("cashierDiscountAmount");
  const val = Math.max(Number(input ? input.value : 0) || 0, 0);
  return Math.min(val, original);
}

function codeBillTotals(){
  enforceTemporaryCustomerRule();

  const totalQty = currentCodeBillItems.reduce((s,i)=>s+Number(i.qty || 0),0);
  const totalWeight = currentCodeBillItems.reduce((s,i)=>s+Number(i.weight || 0),0);

  const originalAmount = typeof getOrderOriginalAmount === "function"
    ? getOrderOriginalAmount()
    : currentCodeBillItems.reduce((sum,item)=>sum + lineAmount(item), 0);

  const discount = typeof getOrderDiscountAmount === "function"
    ? getOrderDiscountAmount()
    : 0;

  const totalAmount = Math.max(originalAmount - discount, 0);
  const mode = document.getElementById("cashierPayMode")?.value || "cash";

  let paid = 0;
  let debt = 0;

  if(mode === "cash"){
    paid = totalAmount;
    debt = 0;
  }else if(mode === "debt"){
    paid = 0;
    debt = totalAmount;
  }else{
    paid = Math.min(Number(document.getElementById("cashierPaidAmount")?.value || 0), totalAmount);
    debt = Math.max(totalAmount - paid, 0);
  }

  // 最终兜底：临时客户必须收银，永远不能产生欠款。
  if(isTemporaryCashierCustomer()){
    paid = totalAmount;
    debt = 0;
    const pay = document.getElementById("cashierPayMode");
    if(pay) pay.value = "cash";
  }

  const discountNote = document.getElementById("cashierDiscountNote")?.value || "";

  return {totalQty,totalWeight,totalAmount,originalAmount,discount,discountNote,paid,debt};
}

function renderCurrentCodeBill(){
  const list = document.getElementById("cashierOrderList");
  if(!list) return;
  list.innerHTML = currentCodeBillItems.map(item=>{
    const fixed = item.pack === "定装";
    return `
      <div class="order-item">
        <div class="order-item-name">
          <b>${esc(item.name)}</b>
          <span>${esc(item.owner)}${esc(item.batchNo)}｜${fixed ? `定装 ${item.spec}斤/${esc(item.unit)}｜销售价可填` : "非定装"}</span>
        </div>
        <div>
          <input type="number" min="0" step="1" value="${item.qty}" onchange="updateCodeBillItem('${item.id}','qty',this.value)">
          <small>${esc(item.unit)}</small>
        </div>
        <div>
          <input type="number" min="0" step="0.01" value="${item.price}" onchange="updateCodeBillItem('${item.id}','price',this.value)">
          <small>${fixed ? "销售件价 元/件" : "销售斤价 元/斤"}</small>
        </div>
        <div class="order-money">${money(lineAmount(item))}</div>
        <button class="order-del" onclick="removeCodeBillItem('${item.id}')">删</button>
        ${fixed ? "" : `<div></div><div><input type="number" min="0" step="0.01" value="${item.weight}" placeholder="斤数" onchange="updateCodeBillItem('${item.id}','weight',this.value)"><small>斤</small></div><div></div><div></div><div></div>`}
      </div>
    `;
  }).join("") || `<div class="order-empty">点击左侧商品加入订单。<br>定装只改件数；非定装输入斤数和价钱。</div>`;

  const t = codeBillTotals();
  document.getElementById("orderTotalQty").textContent = t.totalQty;
  document.getElementById("orderTotalWeight").textContent = t.totalWeight + "斤";
  const originalEl = document.getElementById("orderOriginalAmount");
  const discountEl = document.getElementById("orderDiscountAmount");
  if(originalEl) originalEl.textContent = money(t.originalAmount || 0);
  if(discountEl) discountEl.textContent = money(t.discount || 0);
  document.getElementById("orderTotalAmount").textContent = money(t.totalAmount);
}

function makeShortCodeBillNo(){
  const no = String(shortCodeBillCounter).padStart(4, "0");
  shortCodeBillCounter += 1;
  return no;
}

function makeShortOrderNo(){
  const no = String(shortOrderCounter).padStart(4, "0");
  shortOrderCounter += 1;
  return no;
}

function buildCodeBill(rowsForBill){
  const sourceRows = Array.isArray(rowsForBill) ? rowsForBill : currentCodeBillItems;
  const rows = sourceRows.map(item=>Object.assign({}, item));
  const customer = activeCashierCustomer();
  const totalQty = rows.reduce((s,i)=>s+Number(i.qty || 0),0);
  const totalWeight = rows.reduce((s,i)=>s+Number(i.weight || 0),0);
  const originalAmount = rows.reduce((sum,item)=>sum + lineAmount(item), 0);
  const discount = typeof getOrderDiscountAmount === "function"
    ? getOrderDiscountAmount()
    : 0;
  const totalAmount = Math.max(originalAmount - discount, 0);
  const mode = document.getElementById("cashierPayMode")?.value || "cash";
  let paid = 0;
  let debt = 0;
  if(mode === "cash"){
    paid = totalAmount;
    debt = 0;
  }else if(mode === "debt"){
    paid = 0;
    debt = totalAmount;
  }else{
    paid = Math.min(Number(document.getElementById("cashierPaidAmount")?.value || 0), totalAmount);
    debt = Math.max(totalAmount - paid, 0);
  }
  if(isTemporaryCashierCustomer()){
    paid = totalAmount;
    debt = 0;
    const pay = document.getElementById("cashierPayMode");
    if(pay) pay.value = "cash";
  }
  const discountNote = document.getElementById("cashierDiscountNote")?.value || "";
  const paymentMethod = currentPaymentMethodV121();
  const totals = {totalQty,totalWeight,totalAmount,originalAmount,discount,discountNote,paid,debt};
  const time = new Date().toLocaleString("zh-CN",{hour12:false});
  const billNo = makeShortCodeBillNo();
  const lines = rows.map((i,idx)=>({
    index:idx+1,
    name:i.name,
    owner:i.owner,
    batchNo:i.batchNo,
    type:i.pack,
    qty:Number(i.qty || 0),
    unit:i.unit || "件",
    weight:Number(i.weight || 0),
    price:Number(i.price || 0),
    amount:lineAmount(i)
  }));
  const text = [
    "仓頡码单",
    "码单号：" + billNo,
    "客户：" + customer.name,
    "时间：" + time,
    "----------------",
    ...lines.map(i=>`${i.index}. ${i.name}｜${i.owner}${i.batchNo}｜${i.type}｜${i.qty}${i.unit}｜${i.weight}斤｜${money(i.price)}元/${i.type==="定装"?"件":"斤"}｜${money(i.amount)}`),
    "----------------",
    "总数量：" + totals.totalQty,
    "总重量：" + totals.totalWeight + "斤",
    "原金额：" + money(totals.originalAmount || totals.totalAmount),
    "优惠：" + money(totals.discount || 0) + (totals.discountNote ? "（" + totals.discountNote + "）" : ""),
    "应收金额：" + money(totals.totalAmount),
    "实收：" + money(totals.paid),
    "欠款：" + money(totals.debt)
  ].join("\n");
  return {billNo, customerName:customer.name, customerId:customer.id, time, lines, ...totals, text, status:"未下单"};
}

function openCodeBillModal(){
  if(!currentCodeBillItems.length){
    alert("请先选择商品，再开码单。");
    return;
  }

  const bill = buildCodeBill();
  bill.status = "saved";
  bill.displayStatus = "已开码单";
  bill.__savedV116 = true;
  bill.__savedV116 = true;

  savedCodeBills.unshift(bill);
  selectedBillCenterId = bill.billNo;

  // 开码单后，单子直接进入码单中心；当前收银台清空，准备下一单。
  currentCodeBillItems = [];
  try{
    window.currentCodeBillItems = [];
    window.checkoutCartSnapshotV115 = [];
    window.__cashierCartClearedV116 = true;
    window.__cashierCartClearedReasonV116 = "savedAfterCodeBill";
    const sessions = Array.isArray(window.cashierBillSessionsStep1) ? window.cashierBillSessionsStep1 : [];
    const activeBtn = document.querySelector('#cashierRoot .order-tab.active[data-bill-session]');
    const activeId = activeBtn ? activeBtn.getAttribute('data-bill-session') : '';
    const matchedSession = sessions.find(function(s){ return s && s.id === activeId; }) || sessions[0] || null;
    if(matchedSession){
      matchedSession.items = [];
      matchedSession.status = "clearedAfterSave";
      matchedSession.__cartClearedV116 = true;
      matchedSession.__cartSavedV116 = bill.billNo || true;
      matchedSession.__cartClearedReasonV116 = "savedAfterCodeBill";
      delete matchedSession.__completedV116;
    }
  }catch(err){}
  try{
    window.currentCodeBillItems = [];
    window.checkoutCartSnapshotV115 = [];
    window.__cashierCartClearedV116 = true;
    const sessions = Array.isArray(window.cashierBillSessionsStep1) ? window.cashierBillSessionsStep1 : [];
    const activeBtn = document.querySelector('#cashierRoot .order-tab.active[data-bill-session]');
    const activeId = activeBtn ? activeBtn.getAttribute('data-bill-session') : '';
    const matchedSession = sessions.find(function(s){ return s && s.id === activeId; }) || sessions[0] || null;
    if(matchedSession){
      matchedSession.items = [];
      matchedSession.__cartClearedV116 = true;
      matchedSession.__cartSavedV116 = bill.billNo || true;
      delete matchedSession.__completedV116;
      delete matchedSession.__restoringFromBillV116;
      delete matchedSession.__takenFromBillV116;
    }
  }catch(err){}
  const paidInput = document.getElementById("cashierPaidAmount");
  if(paidInput) paidInput.value = "";
  clearCashierDiscountFields();
  const discountInput = document.getElementById("cashierDiscountAmount");
  if(discountInput) discountInput.value = "";
  const discountNote = document.getElementById("cashierDiscountNote");
  if(discountNote) discountNote.value = "";

  clearCashierDiscountFields();
  renderCurrentCodeBill();
  renderCashierProducts();
  renderBillCenter();
  renderCodeBillHistory();
  renderOrdersCenter();

  // 不再弹出码单服务窗口。
  toast("码单 " + bill.billNo + " 已进入码单中心");
}

function closeCodeBillModal(){
  document.getElementById("codeBillModal")?.classList.remove("show");
}

function renderCodeBillModal(existingBill){
  const bill = existingBill || buildCodeBill();
  document.getElementById("codeBillCustomer").textContent = bill.customerName;
  document.getElementById("codeBillKinds").textContent = bill.lines.length;
  document.getElementById("codeBillQty").textContent = bill.totalQty;
  document.getElementById("codeBillWeight").textContent = bill.totalWeight + "斤";
  document.getElementById("codeBillAmount").textContent = money(bill.totalAmount);
  document.getElementById("codeBillPaid").textContent = money(bill.paid);
  document.getElementById("codeBillDebt").textContent = money(bill.debt);
  document.getElementById("codeBillBody").innerHTML = bill.lines.map(i=>`
    <tr>
      <td>${i.index}</td>
      <td>${esc(i.name)}</td>
      <td>${esc(i.owner)}${esc(i.batchNo)}</td>
      <td>${esc(i.type)}</td>
      <td>${i.qty}${esc(i.unit)}</td>
      <td>${i.weight}斤</td>
      <td>${money(i.price)} / ${i.type === "定装" ? "件" : "斤"}</td>
      <td>${money(i.amount)}</td>
    </tr>
  `).join("");
  document.getElementById("codeBillText").value = bill.text;
  renderCodeBillHistory();
  renderBillCenter();
}

function saveCodeBill(){
  if(!currentCodeBillItems.length){
    toast("当前没有可保存的开单商品");
    return;
  }
  openCodeBillModal();
}

function copyCodeBill(){
  const text = document.getElementById("codeBillText").value;
  if(!text){
    alert("暂无可复制码单。");
    return;
  }
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(()=>toast("码单已复制"));
  }else{
    const area = document.getElementById("codeBillText");
    area.focus();
    area.select();
    document.execCommand("copy");
    toast("码单已复制");
  }
}

function renderCodeBillHistory(){
  const box = document.getElementById("codeBillHistory");
  if(!box) return;
  if(!savedCodeBills.length){
    box.textContent = "暂无保存码单";
    return;
  }
  box.innerHTML = savedCodeBills.slice(0,5).map(b=>`
    <div>${esc(b.time)}｜${esc(b.customerName)}｜${b.lines.length}种｜${b.totalWeight}斤｜${money(b.totalAmount)}｜${esc(b.status)}</div>
  `).join("");
}

function confirmOrderFromCodeBill(){
  if(!currentCodeBillItems.length){
    alert("请先选择商品。");
    return;
  }
  const bill = buildCodeBill();
  const customer = cashierCustomers.find(c=>c.id === bill.customerId);
  if(isTemporaryCashierCustomer()){
    bill.paid = Number(bill.totalAmount || 0);
    bill.debt = 0;
    bill.status = "已收银";
  }
  if(customer && !isTemporaryCashierCustomer()) customer.debt = Number(customer.debt || 0) + Number(bill.debt || 0);

  // 下单后才同步销量：允许库存不足继续成交。
  currentCodeBillItems.forEach(line=>{
    let need = Number(line.qty || 0);
    for(const batch of batches){
      for(const item of batch.items){
        if(item.goodsId === line.goodsId && need > 0){
          const available = Number(item.qty || 0) - Number(item.sold || 0);
          const take = Math.min(Math.max(available,0), need);
          item.sold = Number(item.sold || 0) + take;
          need -= take;
        }
      }
    }
  });

  bill.status = "已下单";
  finalOrders.unshift(bill);
  removePendingDuplicateOrders(bill);
  savedCodeBills.unshift(bill);
  selectedBillCenterId = bill.billNo;
  currentCodeBillItems = [];
  document.getElementById("cashierPaidAmount").value = "";
  closeCodeBillModal();
  renderCashierAll();
  renderGoods();
  renderDetail();
  toast("下单完成：订单、客户欠款、销量已同步");
}


function openBillCenter(){
  renderBillCenter();
  document.getElementById("billCenterModal").classList.add("show");
}

function closeBillCenter(){
  document.getElementById("billCenterModal")?.classList.remove("show");
}

function renderBillCenter(){
  const listBox = document.getElementById("billCenterList");
  const detailBox = document.getElementById("billCenterDetail");
  if(!listBox || !detailBox) return;

  if(!savedCodeBills.length){
    listBox.innerHTML = `<div class="order-empty">暂无码单。<br>在收银页点击“开码单”后，会自动保存到这里。</div>`;
    detailBox.innerHTML = `<div class="bill-detail-empty">暂无码单明细</div>`;
    return;
  }

  if(!selectedBillCenterId || !savedCodeBills.some(b=>b.billNo === selectedBillCenterId)){
    selectedBillCenterId = savedCodeBills[0].billNo;
  }

  listBox.innerHTML = savedCodeBills.map(b=>`
    <div class="bill-card ${b.billNo===selectedBillCenterId?'active':''}" onclick="selectBillCenter('${b.billNo}')">
      <b>${esc(b.billNo)}</b>
      <span>客户：${esc(b.customerName)}</span>
      <span>时间：${esc(b.time)}</span>
      <span>${b.lines.length}种｜${b.totalWeight}斤｜${money(b.totalAmount)}｜${esc(b.status || "已开码单")}</span>
    </div>
  `).join("");

  const bill = savedCodeBills.find(b=>b.billNo === selectedBillCenterId);
  renderBillCenterDetail(bill);
}

function selectBillCenter(billNo){
  selectedBillCenterId = billNo;
  renderBillCenter();
}

function renderBillCenterDetail(bill){
  const box = document.getElementById("billCenterDetail");
  if(!box) return;
  if(!bill){
    box.innerHTML = `<div class="bill-detail-empty">请选择左侧码单</div>`;
    return;
  }

  box.innerHTML = `
    <div class="bill-detail-top">
      <div class="bill-info"><span>码单号</span><b>${esc(bill.billNo)}</b></div>
      <div class="bill-info"><span>客户</span><b>${esc(bill.customerName)}</b></div>
      <div class="bill-info"><span>总重量</span><b>${bill.totalWeight}斤</b></div>
      <div class="bill-info"><span>合计金额</span><b>${money(bill.totalAmount)}</b></div>
    </div>

    <div class="bill-detail-table-wrap">
      <table class="bill-detail-table">
        <thead>
          <tr>
            <th>序号</th>
            <th>货品</th>
            <th>批次</th>
            <th>类型</th>
            <th>数量</th>
            <th>重量</th>
            <th>单价</th>
            <th>金额</th>
          </tr>
        </thead>
        <tbody>
          ${bill.lines.map(i=>`
            <tr>
              <td>${i.index}</td>
              <td>${esc(i.name)}</td>
              <td>${esc(i.owner)}${esc(i.batchNo)}</td>
              <td>${esc(i.type)}</td>
              <td>${i.qty}${esc(i.unit)}</td>
              <td>${i.weight}斤</td>
              <td>${money(i.price)} / ${i.type === "定装" ? "件" : "斤"}</td>
              <td>${money(i.amount)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>

    <div class="bill-center-actions">
      <button class="bill-order-btn" onclick="takeSavedBill('${bill.billNo}')">取单</button>
      <button class="bill-delete-btn" onclick="deleteSavedBill('${bill.billNo}')">删除码单</button>
    </div>

    <textarea class="bill-textarea" readonly>${esc(bill.text)}</textarea>
  `;
}

function copySavedBill(billNo){
  const bill = savedCodeBills.find(b=>b.billNo === billNo);
  if(!bill) return;
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(bill.text).then(()=>toast("码单已复制"));
  }else{
    const area = document.querySelector(".bill-textarea");
    area.focus();
    area.select();
    document.execCommand("copy");
    toast("码单已复制");
  }
}

function deleteSavedBill(billNo){
  if(!confirm("确定删除这张码单吗？")) return;
  savedCodeBills = savedCodeBills.filter(b=>b.billNo !== billNo);
  if(selectedBillCenterId === billNo) selectedBillCenterId = "";
  renderBillCenter();
  renderCodeBillHistory();
  renderOrdersCenter();
  toast("码单已删除");
}

function convertSavedBillToOrder(billNo){
  const bill = savedCodeBills.find(b=>b.billNo === billNo);
  if(!bill) return;
  bill.status = "已下单";
  finalOrders.unshift(bill);
  removePendingDuplicateOrders(bill);
  renderBillCenter();
  renderCodeBillHistory();
  renderOrdersCenter();
  toast("码单已取单");
}

function renderCashierAll(){
  renderCashierCustomers();
  renderCashierBatches();
  renderCashierCatbar();
  renderCashierProducts();
  enforceTemporaryCustomerRule();
  enforceTemporaryCustomerRule();
  renderCurrentCodeBill();
  renderCodeBillHistory();
}


/* ===== V12：码单中心转订单结算流程 ===== */
var pendingSettleBillNo = "";
var pendingSettleMode = "cash";

function chooseSettleMode(mode){
  pendingSettleMode = mode === "debt" ? "debt" : "cash";
  const cash = document.getElementById("settleCashOption");
  const debt = document.getElementById("settleDebtOption");
  if(cash) cash.classList.toggle("active", pendingSettleMode === "cash");
  if(debt) debt.classList.toggle("active", pendingSettleMode === "debt");
}

function openSettleOrderModal(billNo){
  const bill = savedCodeBills.find(b=>b.billNo === billNo);
  if(!bill) return;

  pendingSettleBillNo = billNo;
  pendingSettleMode = "cash";
  chooseSettleMode("cash");

  const info = document.getElementById("settleOrderInfo");
  if(info){
    info.innerHTML = `
      <div>码单号：${esc(bill.billNo)}</div>
      <div>客户：${esc(bill.customerName)}</div>
      <div>合计金额：${money(bill.totalAmount)}</div>
      <div>货品：${bill.lines.length} 种，总重量 ${bill.totalWeight}斤</div>
    `;
  }

  document.getElementById("settleOrderModal")?.classList.add("show");
}

function closeSettleOrderModal(){
  document.getElementById("settleOrderModal")?.classList.remove("show");
}

function convertSavedBillToOrder(billNo){
  openSettleOrderModal(billNo);
}

function completeSettleOrder(){
  const bill = savedCodeBills.find(b=>b.billNo === pendingSettleBillNo);
  if(!bill){
    closeSettleOrderModal();
    return;
  }

  bill.status = pendingSettleMode === "cash" ? "已收银" : "已赊欠";
  bill.orderNo = typeof makeShortOrderNo === "function" ? makeShortOrderNo() : String(finalOrders.length + 1).padStart(4, "0");
  bill.paid = pendingSettleMode === "cash" ? Number(bill.totalAmount || 0) : 0;
  bill.debt = pendingSettleMode === "debt" ? Number(bill.totalAmount || 0) : 0;

  const customer = cashierCustomers.find(c=>c.id === bill.customerId);
  if(customer && pendingSettleMode === "debt"){
    customer.debt = Number(customer.debt || 0) + Number(bill.totalAmount || 0);
  }

  finalOrders.unshift(bill);
  removePendingDuplicateOrders(bill);

  // 完成后，码单生命周期结束，从码单中心移除
  savedCodeBills = savedCodeBills.filter(b=>b.billNo !== pendingSettleBillNo);
  selectedBillCenterId = savedCodeBills[0]?.billNo || "";
  pendingSettleBillNo = "";

  clearCashierDiscountFields();
  closeSettleOrderModal();
  closeBillCenter();
  closeCodeBillModal();

  // 回到开单界面，准备下一单
  showAppPage("cashier");
  renderCashierAll();
  renderBillCenter();
  renderCodeBillHistory();
  renderOrdersCenter();

  toast("订单 " + bill.orderNo + " 已完成：" + (pendingSettleMode === "cash" ? "现金收银" : "赊欠记账"));
}


/* ===== V15：码单中心取单流程 ===== */
function takeSavedBill(billNo){
  const bill = savedCodeBills.find(b=>b.billNo === billNo);
  if(!bill) return;

  bill.status = "taken";
  bill.__restoringFromBillV116 = true;
  bill.__takenV116 = true;

  const restoredRows = bill.lines.map(line=>{
    const goods = goodsMaster.find(g=>g.name === line.name);
    const fixed = line.type === "定装";
    return {
      id:"take" + Date.now() + Math.floor(Math.random()*1000) + line.index,
      goodsId: goods ? goods.id : ("goods_" + line.index),
      name: line.name,
      pack: line.type,
      spec: goods ? (goods.spec || "") : "",
      unit: line.unit || "件",
      qty: Number(line.qty || 0),
      weight: Number(line.weight || 0),
      price: Number(line.price || 0),
      fixedPrice: fixed ? Number(line.price || 0) : undefined,
      batchNo: line.batchNo || "-",
      owner: line.owner || "-"
    };
  });
  bill.__restoringFromBillV116 = true;
  bill.__takenV116 = true;
  try{
    window.currentCodeBillItems = currentCodeBillItems;
    window.checkoutCartSnapshotV115 = [];
    window.__cashierCartClearedV116 = false;
    const sessions = Array.isArray(window.cashierBillSessionsStep1) ? window.cashierBillSessionsStep1 : [];
    const activeBtn = document.querySelector('#cashierRoot .order-tab.active[data-bill-session]');
    const activeId = activeBtn ? activeBtn.getAttribute('data-bill-session') : '';
    const matchedSession = sessions.find(function(s){ return s && s.id === activeId; }) || sessions[0] || null;
    if(matchedSession){
      matchedSession.items = currentCodeBillItems;
      matchedSession.customerId = bill.customerId || matchedSession.customerId || "c1";
      matchedSession.name = bill.customerName || matchedSession.name || "临时客户";
      delete matchedSession.__cartClearedV116;
      delete matchedSession.__completedV116;
      delete matchedSession.__cartSavedV116;
      matchedSession.__restoringFromBillV116 = true;
      matchedSession.__takenFromBillV116 = bill.billNo || true;
    }
  }catch(err){}

  // 从码单中心取出后，该码单从码单中心移除，回到当前收银台。
  savedCodeBills = savedCodeBills.filter(b=>b.billNo !== billNo);
  selectedBillCenterId = savedCodeBills[0]?.billNo || "";

  const customer = cashierCustomers.find(c=>c.id === bill.customerId);
  if(customer){
    const customerSelect = document.getElementById("cashierCustomer");
    if(customerSelect) customerSelect.value = customer.id;
  }

  const paidInput = document.getElementById("cashierPaidAmount");
  if(paidInput) paidInput.value = "";
  const discountInput = document.getElementById("cashierDiscountAmount");
  if(discountInput) discountInput.value = bill.discount ? String(bill.discount) : "";
  const discountNote = document.getElementById("cashierDiscountNote");
  if(discountNote) discountNote.value = bill.discountNote || "";

  closeBillCenter();
  closeCodeBillModal();
  showAppPage("cashier");
  enforceTemporaryCustomerRule();
  renderCashierAll();
  toast(isTemporaryCashierCustomer() ? "已取出码单 " + bill.billNo + "，临时客户只能收银" : "已取出码单 " + bill.billNo + "，请在收银台选择收银或赊欠后下单");
}

// 原来的取单入口不再直接结算，改为取单。
function convertSavedBillToOrder(billNo){
  takeSavedBill(billNo);
}


/* ===== V16：临时客户强制只能收银，正式买家才可赊欠 ===== */

function clearCashierDiscountFields(){
  const discountInput = document.getElementById("cashierDiscountAmount");
  if(discountInput) discountInput.value = "";
  const discountNote = document.getElementById("cashierDiscountNote");
  if(discountNote) discountNote.value = "";
}

function isTemporaryCashierCustomer(){
  const c = activeCashierCustomer ? activeCashierCustomer() : null;
  return !c || c.id === "c1" || c.name === "临时客户" || String(c.name || "").startsWith("临时客户");
}

function handleCustomerOrPayChange(){
  enforceTemporaryCustomerRule();
  renderCurrentCodeBill();
}

function enforceTemporaryCustomerRule(){
  const pay = document.getElementById("cashierPayMode");
  const warning1 = document.getElementById("tempCustomerWarning");
  const warning2 = document.getElementById("tempCustomerStrictWarning");
  if(!pay) return;

  const isTemp = isTemporaryCashierCustomer();

  if(isTemp){
    // 临时客户绝对不能赊欠/部分收款，必须现金结清。
    if(pay.value !== "cash"){
      pay.value = "cash";
      toast("临时客户不能赊欠，只能收银");
    }
    Array.from(pay.options).forEach(opt=>{
      if(opt.value === "debt" || opt.value === "mixed"){
        opt.disabled = true;
      }
    });
    if(warning1) warning1.classList.add("show");
    if(warning2) warning2.style.display = "block";
  }else{
    // 正式买家可以现金、赊欠、部分收款。
    Array.from(pay.options).forEach(opt=>opt.disabled = false);
    if(warning1) warning1.classList.remove("show");
    if(warning2) warning2.style.display = "none";
  }
}


/* ===== V20：订单模块 ===== */
var selectedOrderCenterId = "";

function normalizeOrderType(order){
  if(!order) return "已收银";
  if(order.status === "已收银") return "已收银";
  if(order.status === "已赊欠") return "已赊欠";
  if(order.status === "已下单" && Number(order.debt || 0) > 0) return "已赊欠";
  if(order.status === "已下单") return "已收银";
  if(Number(order.debt || 0) > 0) return "已赊欠";
  return "已收银";
}


function removePendingDuplicateOrders(doneBill){
  if(!doneBill) return;
  const key = doneBill.orderNo || doneBill.billNo;
  finalOrders = (finalOrders || []).filter(o=>{
    const ok = o.orderNo || o.billNo;
    if(ok !== key) return true;
    return normalizeOrderType(o) === "已收银" || normalizeOrderType(o) === "已赊欠";
  });
}

function allOrderRecords(){
  // 订单中心只显示已经完成的订单。
  // 码单属于未完成单，只留在码单中心，不进入订单中心。
  const finalRecords = (finalOrders || []).map(o=>({
    ...o,
    recordSource:"订单",
    displayStatus:normalizeOrderType(o),
    centerId:"order_" + (o.orderNo || o.billNo)
  }));
  return finalRecords.sort((a,b)=>String(b.time || "").localeCompare(String(a.time || "")));
}

function showAppPage(page){
  if(page === "cashier"){
    document.body.classList.remove("show-inbound");
    document.body.classList.add("show-cashier");
    renderCashierAll();
  }else{
    document.body.classList.remove("show-cashier");
    document.body.classList.add("show-inbound");
    renderAll();
  }
}

function activeCashierCustomer(){
  const id = document.getElementById("cashierCustomer")?.value;
  return cashierCustomers.find(c=>c.id === id) || cashierCustomers[0];
}

function addCashierCustomer(){
  const name = prompt("请输入买家名称：");
  if(!name) return;
  const clean = name.trim();
  if(!clean) return;
  const c = {id:"c" + Date.now(), name:clean, debt:0};
  cashierCustomers.push(c);
  renderCashierCustomers();
  document.getElementById("cashierCustomer").value = c.id;
  renderCurrentCodeBill();
  toast("买家已新增");
}

function renderCashierCustomers(){
  const sel = document.getElementById("cashierCustomer");
  if(!sel) return;
  const old = sel.value;
  sel.innerHTML = cashierCustomers.map(c=>`<option value="${c.id}">${esc(c.name)}${c.debt>0 ? "｜欠" + money(c.debt) : ""}</option>`).join("");
  if(old) sel.value = old;
}

function renderCashierBatches(){
  const box = document.getElementById("cashierBatchList");
  if(!box) return;
  const cards = batches.map(b=>`
    <div class="cashier-batch-card ${cashierSelectedBatch===b.id?'active':''}" onclick="selectCashierBatch('${b.id}')">
      <b>${esc(b.owner)}</b>
      <span>${esc(b.no)}｜${esc(b.tag)}</span>
    </div>
  `).join("");
  box.innerHTML = cards;
}

function selectCashierBatch(id){
  cashierSelectedBatch = cashierSelectedBatch === id ? "" : id;
  renderCashierBatches();
  renderCashierProducts();
}



function firstGoodsChar(name){
  if(!name) return "";
  return String(name).trim().slice(0,1);
}

function shortCategoryLabel(cat){
  if(!cat) return "";
  if(cat === "全部") return "全";
  return String(cat).slice(0,1);
}

function renderCashierCatbar(){
  const box = document.getElementById("cashierCatbar");
  if(!box) return;

  // 右侧竖排栏按“当前可售商品名称首字”显示：
  // 商品快捷码默认取名称首字。
  const products = getCashierProducts ? getCashierProducts(true) : [];
  const letters = [];
  products.forEach(p=>{
    const ch = firstGoodsChar(p.name);
    if(ch && !letters.includes(ch)){
      letters.push(ch);
    }
  });

  const cats = ["全部", ...letters];

  if(cashierSelectedCat !== "全部" && !letters.includes(cashierSelectedCat)){
    cashierSelectedCat = "全部";
  }

  box.innerHTML = cats.map(c=>`
    <button class="cashier-cat ${cashierSelectedCat===c?'active':''}" title="${esc(c === "全部" ? "全部" : c)}" onclick="selectCashierCat('${c}')">
      ${esc(c === "全部" ? "全" : c)}
    </button>
  `).join("");
}

function selectCashierCat(cat){
  cashierSelectedCat = cat;
  renderCashierCatbar();
  renderCashierProducts();
}

function getCashierStock(goodsId){
  let qty = 0;
  let weight = 0;
  batches.forEach(b=>{
    b.items.forEach(i=>{
      if(i.goodsId === goodsId){
        const remainQty = Number(i.qty || 0) - Number(i.sold || 0);
        qty += remainQty;
        weight += i.pack === "定装" ? remainQty * Number(i.spec || 0) : Math.max(Number(i.weight || 0),0);
      }
    });
  });
  return {qty, weight};
}

function getCashierProducts(skipLetterFilter){
  const q = (document.getElementById("cashierProductSearch")?.value || "").toLowerCase();
  const mode = document.getElementById("cashierProductMode")?.value || "";
  const selectedBatch = batches.find(b=>b.id === cashierSelectedBatch);

  // 收银只显示已经入过库/出现在批次明细里的货品。
  // 纯商品档案里有、但从未入库的货品，不在收银界面显示。
  const stockedGoodsIds = new Set();
  batches.forEach(b=>{ b.items.forEach(i=>stockedGoodsIds.add(i.goodsId)); });

  let products = goodsMaster.filter(g=>stockedGoodsIds.has(g.id)).map(g=>{
    const stock = getCashierStock(g.id);
    const relatedBatch = selectedBatch ? selectedBatch.items.find(i=>i.goodsId === g.id) : batches.flatMap(b=>b.items.map(i=>({...i, batchNo:b.no, owner:b.owner}))).find(i=>i.goodsId === g.id);
    return {...g, stockQty:stock.qty, stockWeight:stock.weight, relatedBatch};
  });

  if(selectedBatch){ const ids = new Set(selectedBatch.items.map(i=>i.goodsId)); products = products.filter(g=>ids.has(g.id)); }
  if(mode) products = products.filter(g=>g.pack === mode);
  if(!skipLetterFilter && cashierSelectedCat && cashierSelectedCat !== "全部"){
    products = products.filter(g=>firstGoodsChar(g.name) === cashierSelectedCat);
  }
  if(q) products = products.filter(g=>[g.name,g.category,g.pack].join(" ").toLowerCase().includes(q));
  return products;
}

function renderCashierProducts(){
  const box = document.getElementById("cashierProducts");
  if(!box) return;
  const products = getCashierProducts();
  box.innerHTML = products.map(g=>{
    const fixed = g.pack === "定装";
    const active = currentCodeBillItems.some(i=>i.goodsId === g.id);
    const hasStock = Number(g.stockQty || 0) > 0;
    const stockClass = hasStock ? "in-stock" : "out-stock";
    const stockText = hasStock ? `库存：${g.stockQty}${esc(g.unit || "件")}（${g.stockWeight}斤）` : `库存：${g.stockQty}${esc(g.unit || "件")}（${g.stockWeight}斤）｜允许继续销售`;
    return `
      <div class="cashier-product-card ${stockClass} ${active?'active':''}" onclick="openProductBatchPicker('${g.id}')">
        <div class="cashier-product-name">${esc(g.name)}</div>
        <div class="cashier-product-meta ${fixed ? "fixed" : "loose"}">${fixed ? `定装｜${esc(g.spec || 0)}斤/${esc(g.unit || "件")}｜开单填售价` : `非定装｜开单输入斤数和价钱`}</div>
        <div class="cashier-product-meta">${stockText}</div>
      </div>`;
  }).join("") || `<div class="order-empty">当前没有可售货品。<br>请先在入库模块把货品加入批次。</div>`;
}

function addProductToCodeBill(goodsId){
  const g = goodsMaster.find(x=>x.id === goodsId);
  if(!g) return;
  const batchInfo = findFirstBatchForGoods(goodsId);
  const stepSession = typeof activeSession === "function" ? activeSession() : null;
  const v116Session = typeof activeSessionV116 === "function" ? activeSessionV116() : null;
  function activateCartSessionV1(session){
    if(!session) return;
    session.status = "editing";
    delete session.__cartClearedV116;
    delete session.__completedV116;
    delete session.__cartSavedV116;
    delete session.__restoringFromBillV116;
    delete session.__takenFromBillV116;
    delete session.sourceBillId;
  }
  activateCartSessionV1(stepSession);
  if(v116Session && v116Session !== stepSession) activateCartSessionV1(v116Session);
  try{ window.__cashierCartClearedV116 = false; }catch(err){}
  const existing = currentCodeBillItems.find(i=>i.goodsId === goodsId);
  if(existing){
    existing.qty += 1;
    if(existing.pack === "定装"){
      existing.weight = Number(existing.qty || 0) * Number(existing.spec || 0);
    }
  }else{
    const fixed = g.pack === "定装";
    currentCodeBillItems.push({
      id:"billitem" + Date.now() + Math.floor(Math.random()*1000),
      goodsId:g.id,
      name:g.name,
      pack:g.pack || "非定装",
      spec:g.spec || "",
      unit:g.unit || "件",
      qty:1,
      weight:fixed ? Number(g.spec || 0) : "",
      price:Number(g.price || 0),
      fixedPrice:fixed ? Number(g.price || 0) : undefined,
      batchNo:batchInfo.batchNo,
      owner:batchInfo.owner
    });
  }
  if(stepSession){
    stepSession.items = currentCodeBillItems;
  }
  if(v116Session && v116Session !== stepSession){
    v116Session.items = currentCodeBillItems;
  }
  try{ window.currentCodeBillItems = currentCodeBillItems; }catch(err){}
  renderCurrentCodeBill();
  renderCashierProducts();
}

function findFirstBatchForGoods(goodsId){
  for(const b of batches){
    const item = b.items.find(i=>i.goodsId === goodsId);
    if(item) return {batchNo:b.no, owner:b.owner};
  }
  return {batchNo:"-", owner:"-"};
}

function lineAmount(item){
  if(item.pack === "定装"){
    return Number(item.qty || 0) * Number(item.price || 0);
  }
  return Number(item.weight || 0) * Number(item.price || 0);
}

function updateCodeBillItem(itemId, field, value){
  const item = currentCodeBillItems.find(i=>i.id === itemId);
  if(!item) return;
  if(item.pack === "定装"){
    if(field === "qty"){
      item.qty = Number(value || 0);
      item.weight = Number(item.qty || 0) * Number(item.spec || 0);
    }
    if(field === "price"){
      item.price = Number(value || 0);
    }
    // 定装重量只能由件数 × 固定斤数自动计算，不手动改重量。
  }else{
    if(field === "qty") item.qty = Number(value || 0);
    if(field === "weight") item.weight = value === "" ? "" : Number(value || 0);
    if(field === "price") item.price = Number(value || 0);
  }
  renderCurrentCodeBill();
}

function removeCodeBillItem(itemId){
  currentCodeBillItems = currentCodeBillItems.filter(i=>i.id !== itemId);
  renderCurrentCodeBill();
  renderCashierProducts();
}



function clearCashierDiscountFields(){
  const discountInput = document.getElementById("cashierDiscountAmount");
  if(discountInput) discountInput.value = "";
  const discountNote = document.getElementById("cashierDiscountNote");
  if(discountNote) discountNote.value = "";
}

function isTemporaryCashierCustomer(){
  const c = activeCashierCustomer();
  return !c || c.id === "c1" || c.name === "临时客户" || String(c.name || "").startsWith("临时客户");
}

function handleCustomerOrPayChange(){
  enforceTemporaryCustomerRule();
  renderCurrentCodeBill();
}

function enforceTemporaryCustomerRule(){
  const pay = document.getElementById("cashierPayMode");
  const warning = document.getElementById("tempCustomerWarning");
  if(!pay) return;

  if(isTemporaryCashierCustomer()){
    if(pay.value !== "cash"){
      pay.value = "cash";
      toast("临时客户不能赊欠，只能现金结清");
    }
    Array.from(pay.options).forEach(opt=>{
      if(opt.value === "debt" || opt.value === "mixed"){
        opt.disabled = true;
      }
    });
    if(warning) warning.classList.add("show");
  }else{
    Array.from(pay.options).forEach(opt=>opt.disabled = false);
    if(warning) warning.classList.remove("show");
  }
}

function getOrderOriginalAmount(){
  return currentCodeBillItems.reduce((sum,item)=>sum + lineAmount(item), 0);
}

function getOrderDiscountAmount(){
  const original = getOrderOriginalAmount();
  const input = document.getElementById("cashierDiscountAmount");
  const val = Math.max(Number(input ? input.value : 0) || 0, 0);
  return Math.min(val, original);
}

function codeBillTotals(){
  enforceTemporaryCustomerRule();

  const totalQty = currentCodeBillItems.reduce((s,i)=>s+Number(i.qty || 0),0);
  const totalWeight = currentCodeBillItems.reduce((s,i)=>s+Number(i.weight || 0),0);

  const originalAmount = typeof getOrderOriginalAmount === "function"
    ? getOrderOriginalAmount()
    : currentCodeBillItems.reduce((sum,item)=>sum + lineAmount(item), 0);

  const discount = typeof getOrderDiscountAmount === "function"
    ? getOrderDiscountAmount()
    : 0;

  const totalAmount = Math.max(originalAmount - discount, 0);
  const mode = document.getElementById("cashierPayMode")?.value || "cash";

  let paid = 0;
  let debt = 0;

  if(mode === "cash"){
    paid = totalAmount;
    debt = 0;
  }else if(mode === "debt"){
    paid = 0;
    debt = totalAmount;
  }else{
    paid = Math.min(Number(document.getElementById("cashierPaidAmount")?.value || 0), totalAmount);
    debt = Math.max(totalAmount - paid, 0);
  }

  // 最终兜底：临时客户必须收银，永远不能产生欠款。
  if(isTemporaryCashierCustomer()){
    paid = totalAmount;
    debt = 0;
    const pay = document.getElementById("cashierPayMode");
    if(pay) pay.value = "cash";
  }

  const discountNote = document.getElementById("cashierDiscountNote")?.value || "";

  return {totalQty,totalWeight,totalAmount,originalAmount,discount,discountNote,paid,debt};
}

function renderCurrentCodeBill(){
  const list = document.getElementById("cashierOrderList");
  if(!list) return;
  list.innerHTML = currentCodeBillItems.map(item=>{
    const fixed = item.pack === "定装";
    return `
      <div class="order-item">
        <div class="order-item-name">
          <b>${esc(item.name)}</b>
          <span>${esc(item.owner)}${esc(item.batchNo)}｜${fixed ? `定装 ${item.spec}斤/${esc(item.unit)}｜销售价可填` : "非定装"}</span>
        </div>
        <div>
          <input type="number" min="0" step="1" value="${item.qty}" onchange="updateCodeBillItem('${item.id}','qty',this.value)">
          <small>${esc(item.unit)}</small>
        </div>
        <div>
          <input type="number" min="0" step="0.01" value="${item.price}" onchange="updateCodeBillItem('${item.id}','price',this.value)">
          <small>${fixed ? "销售件价 元/件" : "销售斤价 元/斤"}</small>
        </div>
        <div class="order-money">${money(lineAmount(item))}</div>
        <button class="order-del" onclick="removeCodeBillItem('${item.id}')">删</button>
        ${fixed ? "" : `<div></div><div><input type="number" min="0" step="0.01" value="${item.weight}" placeholder="斤数" onchange="updateCodeBillItem('${item.id}','weight',this.value)"><small>斤</small></div><div></div><div></div><div></div>`}
      </div>
    `;
  }).join("") || `<div class="order-empty">点击左侧商品加入订单。<br>定装只改件数；非定装输入斤数和价钱。</div>`;

  const t = codeBillTotals();
  document.getElementById("orderTotalQty").textContent = t.totalQty;
  document.getElementById("orderTotalWeight").textContent = t.totalWeight + "斤";
  const originalEl = document.getElementById("orderOriginalAmount");
  const discountEl = document.getElementById("orderDiscountAmount");
  if(originalEl) originalEl.textContent = money(t.originalAmount || 0);
  if(discountEl) discountEl.textContent = money(t.discount || 0);
  document.getElementById("orderTotalAmount").textContent = money(t.totalAmount);
}

function makeShortCodeBillNo(){
  const no = String(shortCodeBillCounter).padStart(4, "0");
  shortCodeBillCounter += 1;
  return no;
}

function makeShortOrderNo(){
  const no = String(shortOrderCounter).padStart(4, "0");
  shortOrderCounter += 1;
  return no;
}

function buildCodeBill(rowsForBill){
  const sourceRows = Array.isArray(rowsForBill) ? rowsForBill : currentCodeBillItems;
  const rows = sourceRows.map(item=>Object.assign({}, item));
  const customer = activeCashierCustomer();
  const totalQty = rows.reduce((s,i)=>s+Number(i.qty || 0),0);
  const totalWeight = rows.reduce((s,i)=>s+Number(i.weight || 0),0);
  const originalAmount = rows.reduce((sum,item)=>sum + lineAmount(item), 0);
  const discount = typeof getOrderDiscountAmount === "function"
    ? getOrderDiscountAmount()
    : 0;
  const totalAmount = Math.max(originalAmount - discount, 0);
  const mode = document.getElementById("cashierPayMode")?.value || "cash";
  let paid = 0;
  let debt = 0;
  if(mode === "cash"){
    paid = totalAmount;
    debt = 0;
  }else if(mode === "debt"){
    paid = 0;
    debt = totalAmount;
  }else{
    paid = Math.min(Number(document.getElementById("cashierPaidAmount")?.value || 0), totalAmount);
    debt = Math.max(totalAmount - paid, 0);
  }
  if(isTemporaryCashierCustomer()){
    paid = totalAmount;
    debt = 0;
    const pay = document.getElementById("cashierPayMode");
    if(pay) pay.value = "cash";
  }
  const discountNote = document.getElementById("cashierDiscountNote")?.value || "";
  const paymentMethod = currentPaymentMethodV121();
  const totals = {totalQty,totalWeight,totalAmount,originalAmount,discount,discountNote,paid,debt};
  const time = new Date().toLocaleString("zh-CN",{hour12:false});
  const billNo = makeShortCodeBillNo();
  const lines = rows.map((i,idx)=>({
    index:idx+1,
    name:i.name,
    owner:i.owner,
    batchNo:i.batchNo,
    type:i.pack,
    qty:Number(i.qty || 0),
    unit:i.unit || "件",
    weight:Number(i.weight || 0),
    price:Number(i.price || 0),
    amount:lineAmount(i)
  }));
  const text = [
    "仓頡码单",
    "码单号：" + billNo,
    "客户：" + customer.name,
    "时间：" + time,
    "----------------",
    ...lines.map(i=>`${i.index}. ${i.name}｜${i.owner}${i.batchNo}｜${i.type}｜${i.qty}${i.unit}｜${i.weight}斤｜${money(i.price)}元/${i.type==="定装"?"件":"斤"}｜${money(i.amount)}`),
    "----------------",
    "总数量：" + totals.totalQty,
    "总重量：" + totals.totalWeight + "斤",
    "原金额：" + money(totals.originalAmount || totals.totalAmount),
    "优惠：" + money(totals.discount || 0) + (totals.discountNote ? "（" + totals.discountNote + "）" : ""),
    "应收金额：" + money(totals.totalAmount),
    "实收：" + money(totals.paid),
    "欠款：" + money(totals.debt)
  ].join("\n");
  return {
    billNo,
    codeBillId:billNo,
    customerName:customer.name,
    customerId:customer.id,
    time,
    createdAt:time,
    lines,
    paymentMethod,
    paymentMethodLabel:cashierPaymentLabelsV121[paymentMethod] || "现金",
    ...totals,
    text,
    status:"saved"
  };
}

function openCodeBillModal(){
  function sessionClearedForCodeBillSave(session){
    if(!session) return false;
    const status = String(session.status || "");
    return !!(
      status === "clearedAfterSave"
      || status === "clearedAfterSubmit"
      || status === "completed"
      || status === "cleared"
      || session.__cartClearedV116
      || session.__completedV116
      || session.__cartSavedV116
    );
  }
  function cloneRowsForCodeBill(rows){
    return (Array.isArray(rows) ? rows : []).map(item=>Object.assign({}, item));
  }
  function pickLiveRowsForCodeBill(){
    const directRows = cloneRowsForCodeBill(currentCodeBillItems);
    if(directRows.length) return directRows;
    try{
      if(typeof currentCartV116 === "function"){
        const currentRows = cloneRowsForCodeBill(currentCartV116());
        if(currentRows.length) return currentRows;
      }
    }catch(err){}
    if(!sessionClearedForCodeBillSave(activeStepSession) && Array.isArray(activeStepSession && activeStepSession.items) && activeStepSession.items.length){
      return cloneRowsForCodeBill(activeStepSession.items);
    }
    if(!sessionClearedForCodeBillSave(activeV116Session) && Array.isArray(activeV116Session && activeV116Session.items) && activeV116Session.items.length){
      return cloneRowsForCodeBill(activeV116Session.items);
    }
    if(Array.isArray(window.currentCodeBillItems) && window.currentCodeBillItems.length){
      return cloneRowsForCodeBill(window.currentCodeBillItems);
    }
    if(Array.isArray(window.checkoutCartSnapshotV115) && window.checkoutCartSnapshotV115.length){
      return cloneRowsForCodeBill(window.checkoutCartSnapshotV115);
    }
    return [];
  }
  const activeV116Session = typeof activeSessionV116 === "function" ? activeSessionV116() : null;
  const activeStepSession = typeof activeSession === "function" ? activeSession() : null;
  const liveRows = pickLiveRowsForCodeBill();

  if(!liveRows.length){
    alert("请先选择商品，再开码单。");
    return;
  }

  currentCodeBillItems = cloneRowsForCodeBill(liveRows);
  try{ window.currentCodeBillItems = cloneRowsForCodeBill(liveRows); }catch(err){}
  try{ window.checkoutCartSnapshotV115 = cloneRowsForCodeBill(liveRows); }catch(err){}
  if(activeStepSession && !sessionClearedForCodeBillSave(activeStepSession)){
    activeStepSession.items = cloneRowsForCodeBill(liveRows);
  }
  if(activeV116Session && !sessionClearedForCodeBillSave(activeV116Session)){
    activeV116Session.items = cloneRowsForCodeBill(liveRows);
  }

  const bill = buildCodeBill(liveRows);
  if(!Array.isArray(bill.lines) || !bill.lines.length){
    alert("当前购物车为空，暂不能保存码单。");
    return;
  }
  bill.status = "saved";

  savedCodeBills.unshift(bill);
  selectedBillCenterId = bill.billNo;

  // 开码单后，单子直接进入码单中心；当前收银台清空，准备下一单。
  currentCodeBillItems = [];
  const paidInput = document.getElementById("cashierPaidAmount");
  if(paidInput) paidInput.value = "";
  clearCashierDiscountFields();
  const discountInput = document.getElementById("cashierDiscountAmount");
  if(discountInput) discountInput.value = "";
  const discountNote = document.getElementById("cashierDiscountNote");
  if(discountNote) discountNote.value = "";

  clearCashierDiscountFields();
  renderCurrentCodeBill();
  renderCashierProducts();
  renderBillCenter();
  renderCodeBillHistory();
  renderOrdersCenter();

  // 不再弹出码单服务窗口。
  toast("码单 " + bill.billNo + " 已进入码单中心");
}

function closeCodeBillModal(){
  document.getElementById("codeBillModal")?.classList.remove("show");
}

function renderCodeBillModal(existingBill){
  const bill = existingBill || buildCodeBill();
  document.getElementById("codeBillCustomer").textContent = bill.customerName;
  document.getElementById("codeBillKinds").textContent = bill.lines.length;
  document.getElementById("codeBillQty").textContent = bill.totalQty;
  document.getElementById("codeBillWeight").textContent = bill.totalWeight + "斤";
  document.getElementById("codeBillAmount").textContent = money(bill.totalAmount);
  document.getElementById("codeBillPaid").textContent = money(bill.paid);
  document.getElementById("codeBillDebt").textContent = money(bill.debt);
  document.getElementById("codeBillBody").innerHTML = bill.lines.map(i=>`
    <tr>
      <td>${i.index}</td>
      <td>${esc(i.name)}</td>
      <td>${esc(i.owner)}${esc(i.batchNo)}</td>
      <td>${esc(i.type)}</td>
      <td>${i.qty}${esc(i.unit)}</td>
      <td>${i.weight}斤</td>
      <td>${money(i.price)} / ${i.type === "定装" ? "件" : "斤"}</td>
      <td>${money(i.amount)}</td>
    </tr>
  `).join("");
  document.getElementById("codeBillText").value = bill.text;
  renderCodeBillHistory();
  renderBillCenter();
}

function saveCodeBill(){
  if(!currentCodeBillItems.length){
    toast("当前没有可保存的开单商品");
    return;
  }
  openCodeBillModal();
}

function copyCodeBill(){
  const text = document.getElementById("codeBillText").value;
  if(!text){
    alert("暂无可复制码单。");
    return;
  }
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(()=>toast("码单已复制"));
  }else{
    const area = document.getElementById("codeBillText");
    area.focus();
    area.select();
    document.execCommand("copy");
    toast("码单已复制");
  }
}

function renderCodeBillHistory(){
  const box = document.getElementById("codeBillHistory");
  if(!box) return;
  if(!savedCodeBills.length){
    box.textContent = "暂无保存码单";
    return;
  }
  box.innerHTML = savedCodeBills.slice(0,5).map(b=>`
    <div>${esc(b.time)}｜${esc(b.customerName)}｜${b.lines.length}种｜${b.totalWeight}斤｜${money(b.totalAmount)}｜${esc(b.status)}</div>
  `).join("");
}

function confirmOrderFromCodeBill(){
  if(!currentCodeBillItems.length){
    alert("请先选择商品。");
    return;
  }
  const bill = buildCodeBill();
  const customer = cashierCustomers.find(c=>c.id === bill.customerId);
  if(isTemporaryCashierCustomer()){
    bill.paid = Number(bill.totalAmount || 0);
    bill.debt = 0;
    bill.status = "已收银";
  }
  if(customer && !isTemporaryCashierCustomer()) customer.debt = Number(customer.debt || 0) + Number(bill.debt || 0);

  // 下单后才同步销量：允许库存不足继续成交。
  currentCodeBillItems.forEach(line=>{
    let need = Number(line.qty || 0);
    for(const batch of batches){
      for(const item of batch.items){
        if(item.goodsId === line.goodsId && need > 0){
          const available = Number(item.qty || 0) - Number(item.sold || 0);
          const take = Math.min(Math.max(available,0), need);
          item.sold = Number(item.sold || 0) + take;
          need -= take;
        }
      }
    }
  });

  bill.status = "已下单";
  finalOrders.unshift(bill);
  removePendingDuplicateOrders(bill);
  savedCodeBills.unshift(bill);
  selectedBillCenterId = bill.billNo;
  currentCodeBillItems = [];
  document.getElementById("cashierPaidAmount").value = "";
  closeCodeBillModal();
  renderCashierAll();
  renderGoods();
  renderDetail();
  toast("下单完成：订单、客户欠款、销量已同步");
}


function openBillCenter(){
  renderBillCenter();
  document.getElementById("billCenterModal").classList.add("show");
}

function closeBillCenter(){
  document.getElementById("billCenterModal")?.classList.remove("show");
}

function renderBillCenter(){
  const listBox = document.getElementById("billCenterList");
  const detailBox = document.getElementById("billCenterDetail");
  if(!listBox || !detailBox) return;

  if(!savedCodeBills.length){
    listBox.innerHTML = `<div class="order-empty">暂无码单。<br>在收银页点击“开码单”后，会自动保存到这里。</div>`;
    detailBox.innerHTML = `<div class="bill-detail-empty">暂无码单明细</div>`;
    return;
  }

  if(!selectedBillCenterId || !savedCodeBills.some(b=>b.billNo === selectedBillCenterId)){
    selectedBillCenterId = savedCodeBills[0].billNo;
  }

  listBox.innerHTML = savedCodeBills.map(b=>`
    <div class="bill-card ${b.billNo===selectedBillCenterId?'active':''}" onclick="selectBillCenter('${b.billNo}')">
      <b>${esc(b.billNo)}</b>
      <span>客户：${esc(b.customerName)}</span>
      <span>时间：${esc(b.time)}</span>
      <span>${b.lines.length}种｜${b.totalWeight}斤｜${money(b.totalAmount)}｜${esc(b.status || "已开码单")}</span>
    </div>
  `).join("");

  const bill = savedCodeBills.find(b=>b.billNo === selectedBillCenterId);
  renderBillCenterDetail(bill);
}

function selectBillCenter(billNo){
  selectedBillCenterId = billNo;
  renderBillCenter();
}

function renderBillCenterDetail(bill){
  const box = document.getElementById("billCenterDetail");
  if(!box) return;
  if(!bill){
    box.innerHTML = `<div class="bill-detail-empty">请选择左侧码单</div>`;
    return;
  }

  box.innerHTML = `
    <div class="bill-detail-top">
      <div class="bill-info"><span>码单号</span><b>${esc(bill.billNo)}</b></div>
      <div class="bill-info"><span>客户</span><b>${esc(bill.customerName)}</b></div>
      <div class="bill-info"><span>总重量</span><b>${bill.totalWeight}斤</b></div>
      <div class="bill-info"><span>合计金额</span><b>${money(bill.totalAmount)}</b></div>
    </div>

    <div class="bill-detail-table-wrap">
      <table class="bill-detail-table">
        <thead>
          <tr>
            <th>序号</th>
            <th>货品</th>
            <th>批次</th>
            <th>类型</th>
            <th>数量</th>
            <th>重量</th>
            <th>单价</th>
            <th>金额</th>
          </tr>
        </thead>
        <tbody>
          ${bill.lines.map(i=>`
            <tr>
              <td>${i.index}</td>
              <td>${esc(i.name)}</td>
              <td>${esc(i.owner)}${esc(i.batchNo)}</td>
              <td>${esc(i.type)}</td>
              <td>${i.qty}${esc(i.unit)}</td>
              <td>${i.weight}斤</td>
              <td>${money(i.price)} / ${i.type === "定装" ? "件" : "斤"}</td>
              <td>${money(i.amount)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>

    <div class="bill-center-actions">
      <button class="bill-order-btn" onclick="takeSavedBill('${bill.billNo}')">取单</button>
      <button class="bill-delete-btn" onclick="deleteSavedBill('${bill.billNo}')">删除码单</button>
    </div>

    <textarea class="bill-textarea" readonly>${esc(bill.text)}</textarea>
  `;
}

function copySavedBill(billNo){
  const bill = savedCodeBills.find(b=>b.billNo === billNo);
  if(!bill) return;
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(bill.text).then(()=>toast("码单已复制"));
  }else{
    const area = document.querySelector(".bill-textarea");
    area.focus();
    area.select();
    document.execCommand("copy");
    toast("码单已复制");
  }
}

function deleteSavedBill(billNo){
  if(!confirm("确定删除这张码单吗？")) return;
  savedCodeBills = savedCodeBills.filter(b=>b.billNo !== billNo);
  if(selectedBillCenterId === billNo) selectedBillCenterId = "";
  renderBillCenter();
  renderCodeBillHistory();
  renderOrdersCenter();
  toast("码单已删除");
}

function convertSavedBillToOrder(billNo){
  const bill = savedCodeBills.find(b=>b.billNo === billNo);
  if(!bill) return;
  bill.status = "已下单";
  finalOrders.unshift(bill);
  removePendingDuplicateOrders(bill);
  renderBillCenter();
  renderCodeBillHistory();
  renderOrdersCenter();
  toast("码单已取单");
}

function renderCashierAll(){
  renderCashierCustomers();
  renderCashierBatches();
  renderCashierCatbar();
  renderCashierProducts();
  enforceTemporaryCustomerRule();
  enforceTemporaryCustomerRule();
  renderCurrentCodeBill();
  renderCodeBillHistory();
}


/* ===== V12：码单中心转订单结算流程 ===== */
pendingSettleBillNo = "";
pendingSettleMode = "cash";

function chooseSettleMode(mode){
  pendingSettleMode = mode === "debt" ? "debt" : "cash";
  const cash = document.getElementById("settleCashOption");
  const debt = document.getElementById("settleDebtOption");
  if(cash) cash.classList.toggle("active", pendingSettleMode === "cash");
  if(debt) debt.classList.toggle("active", pendingSettleMode === "debt");
}

function openSettleOrderModal(billNo){
  const bill = savedCodeBills.find(b=>b.billNo === billNo);
  if(!bill) return;

  pendingSettleBillNo = billNo;
  pendingSettleMode = "cash";
  chooseSettleMode("cash");

  const info = document.getElementById("settleOrderInfo");
  if(info){
    info.innerHTML = `
      <div>码单号：${esc(bill.billNo)}</div>
      <div>客户：${esc(bill.customerName)}</div>
      <div>合计金额：${money(bill.totalAmount)}</div>
      <div>货品：${bill.lines.length} 种，总重量 ${bill.totalWeight}斤</div>
    `;
  }

  document.getElementById("settleOrderModal")?.classList.add("show");
}

function closeSettleOrderModal(){
  document.getElementById("settleOrderModal")?.classList.remove("show");
}

function convertSavedBillToOrder(billNo){
  openSettleOrderModal(billNo);
}

function completeSettleOrder(){
  const bill = savedCodeBills.find(b=>b.billNo === pendingSettleBillNo);
  if(!bill){
    closeSettleOrderModal();
    return;
  }

  bill.status = pendingSettleMode === "cash" ? "已收银" : "已赊欠";
  bill.orderNo = typeof makeShortOrderNo === "function" ? makeShortOrderNo() : String(finalOrders.length + 1).padStart(4, "0");
  bill.paid = pendingSettleMode === "cash" ? Number(bill.totalAmount || 0) : 0;
  bill.debt = pendingSettleMode === "debt" ? Number(bill.totalAmount || 0) : 0;

  const customer = cashierCustomers.find(c=>c.id === bill.customerId);
  if(customer && pendingSettleMode === "debt"){
    customer.debt = Number(customer.debt || 0) + Number(bill.totalAmount || 0);
  }

  finalOrders.unshift(bill);
  removePendingDuplicateOrders(bill);

  // 完成后，码单生命周期结束，从码单中心移除
  savedCodeBills = savedCodeBills.filter(b=>b.billNo !== pendingSettleBillNo);
  selectedBillCenterId = savedCodeBills[0]?.billNo || "";
  pendingSettleBillNo = "";

  clearCashierDiscountFields();
  closeSettleOrderModal();
  closeBillCenter();
  closeCodeBillModal();

  // 回到开单界面，准备下一单
  showAppPage("cashier");
  renderCashierAll();
  renderBillCenter();
  renderCodeBillHistory();
  renderOrdersCenter();

  toast("订单 " + bill.orderNo + " 已完成：" + (pendingSettleMode === "cash" ? "现金收银" : "赊欠记账"));
}


/* ===== V15：码单中心取单流程 ===== */
function takeSavedBill(billNo){
  const bill = savedCodeBills.find(b=>b.billNo === billNo);
  if(!bill) return;

  bill.status = "taken";
  bill.__restoringFromBillV116 = true;
  bill.__takenV116 = true;

  const restoredRows = bill.lines.map(line=>{
    const goods = goodsMaster.find(g=>g.name === line.name);
    const fixed = line.type === "定装";
    return {
      id:"take" + Date.now() + Math.floor(Math.random()*1000) + line.index,
      goodsId: goods ? goods.id : ("goods_" + line.index),
      name: line.name,
      pack: line.type,
      spec: goods ? (goods.spec || "") : "",
      unit: line.unit || "件",
      qty: Number(line.qty || 0),
      weight: Number(line.weight || 0),
      price: Number(line.price || 0),
      fixedPrice: fixed ? Number(line.price || 0) : undefined,
      batchNo: line.batchNo || "-",
      owner: line.owner || "-"
    };
  });

  // 从码单中心取出后，该码单从码单中心移除，回到当前收银台。
  savedCodeBills = savedCodeBills.filter(b=>b.billNo !== billNo);
  selectedBillCenterId = savedCodeBills[0]?.billNo || "";

  const customer = cashierCustomers.find(c=>c.id === bill.customerId);
  if(customer){
    const customerSelect = document.getElementById("cashierCustomer");
    if(customerSelect) customerSelect.value = customer.id;
  }

  const paidInput = document.getElementById("cashierPaidAmount");
  if(paidInput) paidInput.value = "";
  const discountInput = document.getElementById("cashierDiscountAmount");
  if(discountInput) discountInput.value = bill.discount ? String(bill.discount) : "";
  const discountNote = document.getElementById("cashierDiscountNote");
  if(discountNote) discountNote.value = bill.discountNote || "";

  closeBillCenter();
  closeCodeBillModal();
  showAppPage("cashier");

  currentCodeBillItems = restoredRows;
  window.currentCodeBillItems = restoredRows;
  try{ window.checkoutCartSnapshotV115 = []; }catch(err){}
  try{ window.__cashierCartClearedV116 = false; }catch(err){}

  const activeStepSession = typeof activeSession === "function" ? activeSession() : null;
  const activeV116Session = typeof activeSessionV116 === "function" ? activeSessionV116() : null;
  var sessionCandidates = [];
  [activeStepSession, activeV116Session].forEach(function(session){
    if(session && sessionCandidates.indexOf(session) === -1) sessionCandidates.push(session);
  });
  try{
    var domActive = document.querySelector('#cashierRoot .order-tab.active[data-bill-session]');
    var domId = domActive ? domActive.getAttribute('data-bill-session') : '';
    var sessions = Array.isArray(window.cashierBillSessionsStep1) ? window.cashierBillSessionsStep1 : [];
    var domSession = sessions.find(function(s){ return s && s.id === domId; }) || sessions[0] || null;
    if(domSession && sessionCandidates.indexOf(domSession) === -1) sessionCandidates.push(domSession);
  }catch(err){}
  sessionCandidates.forEach(session=>{
    if(!session) return;
    session.status = "restoringFromBill";
    session.items = restoredRows;
    session.customerId = bill.customerId || session.customerId;
    session.name = bill.customerName || session.name;
    session.__restoreSourceBillV116 = bill.billNo || true;
    session.__restoringFromBillV116 = true;
    session.__takenFromBillV116 = bill.billNo || true;
    try{
      delete session.__cartSavedV116;
      delete session.__cartClearedV116;
      delete session.__completedV116;
    }catch(err){}
  });

  try{ window.selectedCashierCustomerIdV116 = bill.customerId || window.selectedCashierCustomerIdV116; }catch(err){}
  enforceTemporaryCustomerRule();
  renderCashierAll();
  sessionCandidates.forEach(session=>{
    if(!session) return;
    session.status = "taken";
    session.items = restoredRows;
    session.__restoreSourceBillV116 = bill.billNo || true;
    session.__takenFromBillV116 = bill.billNo || true;
    try{ delete session.__restoringFromBillV116; }catch(err){}
  });
  toast(isTemporaryCashierCustomer() ? "已取出码单 " + bill.billNo + "，临时客户只能收银" : "已取出码单 " + bill.billNo + "，请在收银台选择收银或赊欠后下单");
}

// 原来的取单入口不再直接结算，改为取单。
function convertSavedBillToOrder(billNo){
  takeSavedBill(billNo);
}


/* ===== V16：临时客户强制只能收银，正式买家才可赊欠 ===== */

function clearCashierDiscountFields(){
  const discountInput = document.getElementById("cashierDiscountAmount");
  if(discountInput) discountInput.value = "";
  const discountNote = document.getElementById("cashierDiscountNote");
  if(discountNote) discountNote.value = "";
}

function isTemporaryCashierCustomer(){
  const c = activeCashierCustomer ? activeCashierCustomer() : null;
  return !c || c.id === "c1" || c.name === "临时客户" || String(c.name || "").startsWith("临时客户");
}

function handleCustomerOrPayChange(){
  enforceTemporaryCustomerRule();
  renderCurrentCodeBill();
}

function enforceTemporaryCustomerRule(){
  const pay = document.getElementById("cashierPayMode");
  const warning1 = document.getElementById("tempCustomerWarning");
  const warning2 = document.getElementById("tempCustomerStrictWarning");
  if(!pay) return;

  const isTemp = isTemporaryCashierCustomer();

  if(isTemp){
    // 临时客户绝对不能赊欠/部分收款，必须现金结清。
    if(pay.value !== "cash"){
      pay.value = "cash";
      toast("临时客户不能赊欠，只能收银");
    }
    Array.from(pay.options).forEach(opt=>{
      if(opt.value === "debt" || opt.value === "mixed"){
        opt.disabled = true;
      }
    });
    if(warning1) warning1.classList.add("show");
    if(warning2) warning2.style.display = "block";
  }else{
    // 正式买家可以现金、赊欠、部分收款。
    Array.from(pay.options).forEach(opt=>opt.disabled = false);
    if(warning1) warning1.classList.remove("show");
    if(warning2) warning2.style.display = "none";
  }
}


/* ===== V20：订单模块 ===== */
selectedOrderCenterId = "";

function normalizeOrderType(order){
  if(!order) return "已收银";
  if(order.status === "已收银") return "已收银";
  if(order.status === "已赊欠") return "已赊欠";
  if(order.status === "已下单" && Number(order.debt || 0) > 0) return "已赊欠";
  if(order.status === "已下单") return "已收银";
  if(Number(order.debt || 0) > 0) return "已赊欠";
  return "已收银";
}


function removePendingDuplicateOrders(doneBill){
  if(!doneBill) return;
  const key = doneBill.orderNo || doneBill.billNo;
  finalOrders = (finalOrders || []).filter(o=>{
    const ok = o.orderNo || o.billNo;
    if(ok !== key) return true;
    return normalizeOrderType(o) === "已收银" || normalizeOrderType(o) === "已赊欠";
  });
}

function allOrderRecords(){
  const codebillRecords = (savedCodeBills || []).map(b=>({
    ...b,
    recordSource:"订单",
    displayStatus:"待处理",
    centerId:"codebill_" + b.billNo
  }));
  const finalRecords = (finalOrders || []).map(o=>({
    ...o,
    recordSource:"订单",
    displayStatus:normalizeOrderType(o),
    centerId:"order_" + (o.orderNo || o.billNo)
  }));
  return [...codebillRecords, ...finalRecords].sort((a,b)=>String(b.time || "").localeCompare(String(a.time || "")));
}

function showAppPage(page){
  document.body.classList.remove("show-inbound","show-cashier","show-orders");
  if(page === "cashier"){
    document.body.classList.add("show-cashier");
    renderCashierAll();
  }else if(page === "orders"){
    document.body.classList.add("show-orders");
    renderOrdersCenter();
  }else{
    document.body.classList.add("show-inbound");
    renderAll();
  }
}

function renderOrdersCenter(){
  const list = document.getElementById("ordersList");
  const detail = document.getElementById("ordersDetailBody");
  if(!list || !detail) return;

  const q = (document.getElementById("ordersSearch")?.value || "").toLowerCase();
  const status = document.getElementById("ordersStatusFilter")?.value || "";

  let records = allOrderRecords();

  if(status){
    records = records.filter(r=>r.displayStatus === status);
  }

  if(q){
    records = records.filter(r=>{
      const goodsText = (r.lines || []).map(i=>i.name).join(" ");
      return [r.billNo,r.orderNo,r.customerName,r.displayStatus,goodsText].join(" ").toLowerCase().includes(q);
    });
  }

  if(!records.length){
    list.innerHTML = `<div class="orders-empty">暂无匹配的已完成订单</div>`;
    detail.innerHTML = `<div class="orders-empty">暂无订单详情</div>`;
    selectedOrderCenterId = "";
    return;
  }

  if(!selectedOrderCenterId || !records.some(r=>r.centerId === selectedOrderCenterId)){
    selectedOrderCenterId = records[0].centerId;
  }

  list.innerHTML = records.map(r=>{
    const cls = r.displayStatus === "待处理" ? "status-codebill" : (r.displayStatus === "已赊欠" ? "status-debt" : "status-cash");
    return `
      <div class="order-card ${r.centerId===selectedOrderCenterId?'active':''}" onclick="selectOrderRecord('${r.centerId}')">
        <b>${esc("订单 " + (r.orderNo || r.billNo))}</b>
        <span>客户：${esc(r.customerName || "")}</span>
        <span>时间：${esc(r.time || "")}</span>
        <span>${(r.lines||[]).length}种｜${r.totalWeight || 0}斤｜${money(r.totalAmount || 0)}</span>
        <em class="order-status ${cls}">${esc(r.displayStatus === "待处理" ? "待处理订单" : r.displayStatus)}</em>
      </div>
    `;
  }).join("");

  const selected = records.find(r=>r.centerId === selectedOrderCenterId);
  renderOrderDetail(selected);
}

function selectOrderRecord(centerId){
  selectedOrderCenterId = centerId;
  renderOrdersCenter();
}

function renderOrderDetail(order){
  const box = document.getElementById("ordersDetailBody");
  if(!box) return;
  if(!order){
    box.innerHTML = `<div class="orders-empty">请选择左侧单据</div>`;
    return;
  }

  const title = document.getElementById("ordersDetailTitle");
  const sub = document.getElementById("ordersDetailSub");
  if(title) title.textContent = "订单 " + (order.orderNo || order.billNo);
  if(sub) sub.textContent = `${order.customerName || ""}｜${order.time || ""}｜${order.displayStatus || ""}`;

  box.innerHTML = `
    <div class="order-info-grid">
      <div class="order-info-card"><span>单号</span><b>${esc(order.orderNo || order.billNo || "")}</b></div>
      <div class="order-info-card"><span>客户</span><b>${esc(order.customerName || "")}</b></div>
      <div class="order-info-card"><span>状态</span><b>${esc(order.displayStatus || "")}</b></div>
      <div class="order-info-card"><span>总重量</span><b>${order.totalWeight || 0}斤</b></div>
      <div class="order-info-card"><span>金额</span><b>${money(order.totalAmount || 0)}</b></div>
    </div>

    <div class="order-detail-table-wrap">
      <table class="order-detail-table">
        <thead>
          <tr>
            <th>序号</th><th>货品</th><th>批次</th><th>类型</th><th>数量</th><th>重量</th><th>单价</th><th>金额</th>
          </tr>
        </thead>
        <tbody>
          ${(order.lines || []).map(i=>`
            <tr>
              <td>${i.index}</td>
              <td>${esc(i.name)}</td>
              <td>${esc(i.owner || "")}${esc(i.batchNo || "")}</td>
              <td>${esc(i.type)}</td>
              <td>${i.qty}${esc(i.unit || "件")}</td>
              <td>${i.weight}斤</td>
              <td>${money(i.price)} / ${i.type === "定装" ? "件" : "斤"}</td>
              <td>${money(i.amount)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>

    <div class="order-lifecycle">
      <h3>单据记录</h3>
      <div class="lifecycle-row">
        <div class="lifecycle-dot">1</div>
        <div>
          <b>订单</b><br>
          ${esc(order.time || "")}<br>
          状态：${esc(order.displayStatus === "待处理" ? "待处理订单" : (order.displayStatus || ""))}
        </div>
      </div>
    </div>

    <textarea class="order-textarea" readonly>${esc((order.text || "").replaceAll("仓頡码单","仓頡订单").replaceAll("码单号：","订单号："))}</textarea>
  `;
}

function currentSelectedOrderRecord(){
  return allOrderRecords().find(r=>r.centerId === selectedOrderCenterId);
}

function copySelectedOrder(){
  const order = currentSelectedOrderRecord();
  if(!order) return;
  const text = order.text || "";
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(()=>toast("单据已复制"));
  }else{
    const area = document.querySelector(".order-textarea");
    if(area){
      area.focus();
      area.select();
      document.execCommand("copy");
      toast("单据已复制");
    }
  }
}

function takeSelectedOrder(){
  toast("订单中心只显示已完成订单；未完成码单请到码单中心取单。");
}


function renderCurrentCodeBill(){
  const list = document.getElementById("cashierOrderList");
  if(!list) return;

  list.innerHTML = currentCodeBillItems.map(item=>{
    const fixed = item.pack === "定装";
    return `
      <div class="order-item ${fixed ? "fixed-row" : "loose-row"}">
        <div class="order-item-name">
          <b>${esc(item.name)}</b>
          <span>${esc(item.owner)}${esc(item.batchNo)}｜${fixed ? `定装 ${item.spec || item.weight}斤/${esc(item.unit || "件")}｜销售件价可填` : "非定装｜填写斤数和销售斤价"}</span>
        </div>

        <div>
          <input type="number" min="0" step="1" value="${item.qty}" onchange="updateCodeBillItem('${item.id}','qty',this.value)">
          <small>${esc(item.unit || "件")}</small>
        </div>

        <div>
          <input type="number" min="0" step="0.01" value="${item.price}" onchange="updateCodeBillItem('${item.id}','price',this.value)">
          <small>${fixed ? "销售件价 元/件" : "销售斤价 元/斤"}</small>
        </div>

        <div class="order-money">${money(lineAmount(item))}</div>

        <button class="order-del" onclick="removeCodeBillItem('${item.id}')">删</button>

        ${fixed ? "" : `
          <div></div>
          <div>
            <input type="number" min="0" step="0.01" value="${item.weight}" placeholder="输入斤数" onchange="updateCodeBillItem('${item.id}','weight',this.value)">
            <small>斤数</small>
          </div>
          <div></div>
          <div></div>
          <div></div>
        `}
      </div>
    `;
  }).join("") || `<div class="order-empty">点击左侧商品加入订单。<br>定装只改件数和售价；非定装输入斤数和销售斤价。</div>`;

  const t = codeBillTotals();
  document.getElementById("orderTotalQty").textContent = t.totalQty;
  document.getElementById("orderTotalWeight").textContent = t.totalWeight + "斤";

  const originalEl = document.getElementById("orderOriginalAmount");
  const discountEl = document.getElementById("orderDiscountAmount");
  if(originalEl) originalEl.textContent = money(t.originalAmount || t.totalAmount || 0);
  if(discountEl) discountEl.textContent = money(t.discount || 0);

  document.getElementById("orderTotalAmount").textContent = money(t.totalAmount);
}


/* ===== V21：码单中心只显示未完成码单，已完成单去订单中心 ===== */
function pendingCodeBills(){
  return (savedCodeBills || []).filter(b=>{
    const st = String(b.status || "");
    return st !== "已下单" && st !== "已收银" && st !== "已赊欠";
  });
}

function renderBillCenter(){
  const listBox = document.getElementById("billCenterList");
  const detailBox = document.getElementById("billCenterDetail");
  if(!listBox || !detailBox) return;

  const pending = pendingCodeBills();

  if(!pending.length){
    listBox.innerHTML = `<div class="order-empty">暂无码单。<br>点击“开码单”后，会自动保存到这里。</div>`;
    detailBox.innerHTML = `<div class="bill-detail-empty">暂无码单明细</div>`;
    return;
  }

  if(!selectedBillCenterId || !pending.some(b=>b.billNo === selectedBillCenterId)){
    selectedBillCenterId = pending[0].billNo;
  }

  listBox.innerHTML = pending.map(b=>`
    <div class="bill-card ${b.billNo===selectedBillCenterId?'active':''}" onclick="selectBillCenter('${b.billNo}')">
      <b>${esc(b.billNo)}</b>
      <span>客户：${esc(b.customerName)}</span>
      <span>时间：${esc(b.time)}</span>
      <span>${b.lines.length}种｜${b.totalWeight}斤｜${money(b.totalAmount)}｜${esc(b.status || "已开码单")}</span>
    </div>
  `).join("");

  const bill = pending.find(b=>b.billNo === selectedBillCenterId);
  renderBillCenterDetail(bill);
}

function selectBillCenter(billNo){
  selectedBillCenterId = billNo;
  renderBillCenter();
}

function renderBillCenterDetail(bill){
  const box = document.getElementById("billCenterDetail");
  if(!box) return;
  if(!bill){
    box.innerHTML = `<div class="bill-detail-empty">请选择左侧码单</div>`;
    return;
  }

  box.innerHTML = `
    <div class="bill-detail-top">
      <div class="bill-info"><span>码单号</span><b>${esc(bill.billNo)}</b></div>
      <div class="bill-info"><span>客户</span><b>${esc(bill.customerName)}</b></div>
      <div class="bill-info"><span>总重量</span><b>${bill.totalWeight}斤</b></div>
      <div class="bill-info"><span>合计金额</span><b>${money(bill.totalAmount)}</b></div>
    </div>

    <div class="bill-detail-table-wrap">
      <table class="bill-detail-table">
        <thead>
          <tr>
            <th>序号</th>
            <th>货品</th>
            <th>批次</th>
            <th>类型</th>
            <th>数量</th>
            <th>重量</th>
            <th>单价</th>
            <th>金额</th>
          </tr>
        </thead>
        <tbody>
          ${bill.lines.map(i=>`
            <tr>
              <td>${i.index}</td>
              <td>${esc(i.name)}</td>
              <td>${esc(i.owner)}${esc(i.batchNo)}</td>
              <td>${esc(i.type)}</td>
              <td>${i.qty}${esc(i.unit || "件")}</td>
              <td>${i.weight}斤</td>
              <td>${money(i.price)} / ${i.type === "定装" ? "件" : "斤"}</td>
              <td>${money(i.amount)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>

    <div class="bill-center-actions">
      <button class="bill-order-btn" onclick="takeSavedBill('${bill.billNo}')">取单</button>
      <button class="bill-delete-btn" onclick="deleteSavedBill('${bill.billNo}')">删除码单</button>
    </div>

    <textarea class="bill-textarea" readonly>${esc(bill.text)}</textarea>
  `;
}

function deleteSavedBill(billNo){
  if(!confirm("确定删除这张码单吗？")) return;
  savedCodeBills = savedCodeBills.filter(b=>b.billNo !== billNo);
  if(selectedBillCenterId === billNo) selectedBillCenterId = "";
  renderBillCenter();
  renderCodeBillHistory();
  renderOrdersCenter();
  toast("码单已删除");
}

function renderCodeBillHistory(){
  const box = document.getElementById("codeBillHistory");
  if(!box) return;
  const pending = pendingCodeBills();
  if(!pending.length){
    box.textContent = "暂无保存码单";
    return;
  }
  box.innerHTML = pending.slice(0,5).map(b=>`
    <div>${esc(b.time)}｜${esc(b.customerName)}｜${b.lines.length}种｜${b.totalWeight}斤｜${money(b.totalAmount)}｜${esc(b.status || "已开码单")}</div>
  `).join("");
}


/* ===== V21：完成订单后从码单中心移除，只保留到订单中心 ===== */
function completeSettleOrder(){
  const bill = savedCodeBills.find(b=>b.billNo === pendingSettleBillNo);
  if(!bill){
    closeSettleOrderModal();
    return;
  }

  if(billIsTemporaryCustomer && billIsTemporaryCustomer(bill)){
    pendingSettleMode = "cash";
  }

  bill.status = pendingSettleMode === "cash" ? "已收银" : "已赊欠";
  bill.orderNo = makeShortOrderNo ? makeShortOrderNo() : String(finalOrders.length + 1).padStart(4, "0");
  bill.paid = pendingSettleMode === "cash" ? Number(bill.totalAmount || 0) : 0;
  bill.debt = pendingSettleMode === "debt" ? Number(bill.totalAmount || 0) : 0;

  const customer = cashierCustomers.find(c=>c.id === bill.customerId);
  if(customer && pendingSettleMode === "debt"){
    customer.debt = Number(customer.debt || 0) + Number(bill.totalAmount || 0);
  }

  finalOrders.unshift(bill);
  removePendingDuplicateOrders(bill);

  // 关键：完成后的单子不再属于码单中心。
  savedCodeBills = savedCodeBills.filter(b=>b.billNo !== pendingSettleBillNo);
  selectedBillCenterId = savedCodeBills[0]?.billNo || "";
  pendingSettleBillNo = "";

  if(typeof clearCashierDiscountFields === "function") clearCashierDiscountFields();

  closeSettleOrderModal();
  closeBillCenter();
  closeCodeBillModal();

  showAppPage("cashier");
  renderCashierAll();
  renderBillCenter();
  renderCodeBillHistory();
  renderOrdersCenter();

  toast("订单 " + bill.orderNo + " 已完成：" + (pendingSettleMode === "cash" ? "现金收银" : "赊欠记账"));
}

fillCategoryOptions();
initModalSegments();
renderOwnerOptions();
renderAll();
renderCashierAll();

/* ===== V27 最终覆盖：订单中心只显示已完成订单，码单不进入订单中心 ===== */
function normalizeOrderType(order){
  if(!order) return "待处理";
  if(order.status === "已收银") return "已收银";
  if(order.status === "已赊欠") return "已赊欠";
  if(order.status === "已下单" && Number(order.debt || 0) > 0) return "已赊欠";
  if(order.status === "已下单") return "已收银";
  if(Number(order.debt || 0) > 0) return "已赊欠";
  if(Number(order.paid || 0) > 0) return "已收银";
  return "待处理";
}

function allOrderRecords(){
  // 订单中心只显示已经完成的订单；码单半成品只留在码单中心。
  const completed = (finalOrders || []).filter(o=>{
    const st = normalizeOrderType(o);
    return st === "已收银" || st === "已赊欠" || st === "已作废";
  });

  // 同一张单只保留一条完成记录。
  const map = new Map();
  completed.forEach(o=>{
    const key = o.orderNo || o.billNo;
    map.set(key, {
      ...o,
      recordSource:"订单",
      displayStatus:normalizeOrderType(o),
      centerId:"order_" + key
    });
  });

  return Array.from(map.values()).sort((a,b)=>String(b.time || "").localeCompare(String(a.time || "")));
}

function renderOrdersCenter(){
  const list = document.getElementById("ordersList");
  const detail = document.getElementById("ordersDetailBody");
  if(!list || !detail) return;

  const q = (document.getElementById("ordersSearch")?.value || "").toLowerCase();
  const status = document.getElementById("ordersStatusFilter")?.value || "";

  let records = allOrderRecords();

  if(status){
    records = records.filter(r=>r.displayStatus === status);
  }

  if(q){
    records = records.filter(r=>{
      const goodsText = (r.lines || []).map(i=>i.name).join(" ");
      return [r.billNo,r.orderNo,r.customerName,r.displayStatus,goodsText].join(" ").toLowerCase().includes(q);
    });
  }

  if(!records.length){
    list.innerHTML = `<div class="orders-empty">暂无已完成订单。<br>码单取单并完成收银或赊欠后，才会进入订单中心。</div>`;
    detail.innerHTML = `<div class="orders-empty">暂无订单详情</div>`;
    selectedOrderCenterId = "";
    return;
  }

  if(!selectedOrderCenterId || !records.some(r=>r.centerId === selectedOrderCenterId)){
    selectedOrderCenterId = records[0].centerId;
  }

  list.innerHTML = records.map(r=>{
    const paymentLabel = orderPaymentLabelV121(r);
    const cls = r.displayStatus === "已作废" ? "status-void" : (r.displayStatus === "已赊欠" ? "status-debt" : "status-cash");
    return `
      <div class="order-card ${r.centerId===selectedOrderCenterId?'active':''}" onclick="selectOrderRecord('${r.centerId}')">
        <b>${esc("订单 " + (r.orderNo || r.billNo))}</b>
        <span>客户：${esc(r.customerName || "")}</span>
        <span>时间：${esc(r.time || "")}</span>
        <span>${(r.lines||[]).length}种｜${r.totalWeight || 0}斤｜${money(r.totalAmount || 0)}｜${esc(paymentLabel)}</span>
        <em class="order-status ${cls}">${esc(r.displayStatus)}</em>
      </div>
    `;
  }).join("");

  const selected = records.find(r=>r.centerId === selectedOrderCenterId);
  renderOrderDetail(selected);
}

function renderOrderDetail(order){
  const box = document.getElementById("ordersDetailBody");
  if(!box) return;
  if(!order){
    box.innerHTML = `<div class="orders-empty">请选择左侧订单</div>`;
    return;
  }

  const title = document.getElementById("ordersDetailTitle");
  const sub = document.getElementById("ordersDetailSub");
  const paymentLabel = orderPaymentLabelV121(order);
  if(title) title.textContent = "订单 " + (order.orderNo || order.billNo);
  if(sub) sub.textContent = `${order.customerName || ""}｜${order.time || ""}｜${order.displayStatus || ""}`;

  const orderText = (order.text || "").replaceAll("仓頡码单","仓頡订单").replaceAll("码单号：","订单号：");

  box.innerHTML = `
    <div class="order-info-grid">
      <div class="order-info-card"><span>单号</span><b>${esc(order.orderNo || order.billNo || "")}</b></div>
      <div class="order-info-card"><span>客户</span><b>${esc(order.customerName || "")}</b></div>
      <div class="order-info-card"><span>状态</span><b>${esc(order.displayStatus || "")}</b></div>
      <div class="order-info-card"><span>支付方式</span><b>${esc(paymentLabel)}</b></div>
      <div class="order-info-card"><span>总重量</span><b>${order.totalWeight || 0}斤</b></div>
      <div class="order-info-card"><span>金额</span><b>${money(order.totalAmount || 0)}</b></div>
    </div>

    <div class="order-detail-table-wrap">
      <table class="order-detail-table">
        <thead>
          <tr>
            <th>序号</th><th>货品</th><th>批次</th><th>类型</th><th>数量</th><th>重量</th><th>单价</th><th>金额</th>
          </tr>
        </thead>
        <tbody>
          ${(order.lines || []).map(i=>`
            <tr>
              <td>${i.index}</td>
              <td>${esc(i.name)}</td>
              <td>${esc(i.owner || "")}${esc(i.batchNo || "")}</td>
              <td>${esc(i.type)}</td>
              <td>${i.qty}${esc(i.unit || "件")}</td>
              <td>${i.weight}斤</td>
              <td>${money(i.price)} / ${i.type === "定装" ? "件" : "斤"}</td>
              <td>${money(i.amount)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>

    <div class="order-lifecycle">
      <h3>单据记录</h3>
      <div class="lifecycle-row">
        <div class="lifecycle-dot">1</div>
        <div>
          <b>订单</b><br>
          ${esc(order.time || "")}<br>
          状态：${esc(order.displayStatus || "")}
        </div>
      </div>
    </div>

    <textarea class="order-textarea" readonly>${esc(orderText)}</textarea>
  `;
}

function pushCompletedOrder(bill){
  if(!bill) return;
  if(!bill.orderNo){
    bill.orderNo = typeof makeShortOrderNo === "function" ? makeShortOrderNo() : String((finalOrders || []).length + 1).padStart(4, "0");
  }
  if(isTemporaryCashierCustomer && isTemporaryCashierCustomer()){
    bill.paid = Number(bill.totalAmount || 0);
    bill.debt = 0;
    bill.status = "已收银";
  }else{
    bill.status = Number(bill.debt || 0) > 0 ? "已赊欠" : "已收银";
  }

  // 完成后不再属于码单中心。
  savedCodeBills = (savedCodeBills || []).filter(b=>b.billNo !== bill.billNo);

  const key = bill.orderNo || bill.billNo;
  finalOrders = (finalOrders || []).filter(o=>(o.orderNo || o.billNo) !== key);
  finalOrders.unshift(bill);
}

function confirmOrderFromCodeBill(){
  if(!currentCodeBillItems.length){
    alert("请先选择商品。");
    return;
  }

  const bill = buildCodeBill();

  const customer = cashierCustomers.find(c=>c.id === bill.customerId);
  if(customer && !isTemporaryCashierCustomer()){
    customer.debt = Number(customer.debt || 0) + Number(bill.debt || 0);
  }

  // 下单后同步销量：允许库存不足继续成交。
  currentCodeBillItems.forEach(line=>{
    let need = Number(line.qty || 0);
    for(const batch of batches){
      for(const item of batch.items){
        if(item.goodsId === line.goodsId && need > 0){
          const available = Number(item.qty || 0) - Number(item.sold || 0);
          const take = Math.min(Math.max(available,0), need);
          item.sold = Number(item.sold || 0) + take;
          need -= take;
        }
      }
    }
  });

  pushCompletedOrder(bill);

  currentCodeBillItems = [];
  try{ window.currentCodeBillItems = currentCodeBillItems; }catch(err){}
  try{ window.checkoutCartSnapshotV115 = []; }catch(err){}
  try{ window.__cashierCartClearedV116 = true; }catch(err){}
  try{
    var sessionRows = Array.isArray(window.cashierBillSessionsStep1) ? window.cashierBillSessionsStep1 : [];
    if(sessionRows.length){
      var activeTab = document.querySelector('#cashierRoot .order-tab.active[data-bill-session]');
      var activeSessionId = activeTab ? activeTab.getAttribute('data-bill-session') : '';
      sessionRows.forEach(function(session){
        if(!session) return;
        if(!activeSessionId || session.id === activeSessionId || Array.isArray(session.items)){
          session.items = [];
          session.__cartClearedV116 = true;
          session.__completedV116 = true;
        }
      });
    }
  }catch(err){}
  const paidInput = document.getElementById("cashierPaidAmount");
  if(paidInput) paidInput.value = "";
  if(typeof clearCashierDiscountFields === "function") clearCashierDiscountFields();

  closeCodeBillModal();
  renderCashierAll();
  renderGoods();
  renderDetail();
  renderOrdersCenter();
  toast("订单 " + bill.orderNo + " 已完成");
}

function completeSettleOrder(){
  const bill = savedCodeBills.find(b=>b.billNo === pendingSettleBillNo);
  if(!bill){
    closeSettleOrderModal();
    return;
  }

  if(billIsTemporaryCustomer && billIsTemporaryCustomer(bill)){
    pendingSettleMode = "cash";
  }

  bill.paid = pendingSettleMode === "cash" ? Number(bill.totalAmount || 0) : 0;
  bill.debt = pendingSettleMode === "debt" ? Number(bill.totalAmount || 0) : 0;

  const customer = cashierCustomers.find(c=>c.id === bill.customerId);
  if(customer && pendingSettleMode === "debt"){
    customer.debt = Number(customer.debt || 0) + Number(bill.totalAmount || 0);
  }

  pushCompletedOrder(bill);

  selectedBillCenterId = savedCodeBills[0]?.billNo || "";
  pendingSettleBillNo = "";

  if(typeof clearCashierDiscountFields === "function") clearCashierDiscountFields();

  closeSettleOrderModal();
  closeBillCenter();
  closeCodeBillModal();

  showAppPage("cashier");
  renderCashierAll();
  renderBillCenter();
  renderCodeBillHistory();
  renderOrdersCenter();

  toast("订单 " + bill.orderNo + " 已完成：" + (bill.debt > 0 ? "赊欠记账" : "现金收银"));
}


/* ===== V28：库存批次查看逻辑 ===== */
function formatInventoryAmount(qty, weight, unit){
  return `${Number(qty || 0)}${esc(unit || "件")}<div class="inventory-sub">(${Number(weight || 0)}斤)</div>`;
}
function getInventoryItemCalc(item){
  const qty = Number(item.qty || 0);
  const sold = Number(item.sold || 0);
  const spec = Number(item.spec || 0);
  const unit = item.unit || "件";
  const fixed = item.pack === "定装";
  const inWeight = fixed ? qty * spec : Number(item.weight || 0);
  let soldWeight = fixed ? sold * spec : Number(item.soldWeight || 0);
  const remainQty = qty - sold;
  if(!fixed && remainQty <= 0 && inWeight > 0 && soldWeight < inWeight) soldWeight = inWeight;
  const remainWeight = fixed ? remainQty * spec : inWeight - soldWeight;
  return {qty,sold,remainQty,inWeight,soldWeight,remainWeight,unit,fixed};
}
function showInventoryView(){
  document.body.classList.add("inventory-mode");
  renderInventoryView();
}
function exitInventoryViewToInbound(){
  document.body.classList.remove("inventory-mode");
  if(typeof renderAll === "function") renderAll();
}
function renderInventoryView(){
  const batch = (typeof activeBatch === "function") ? activeBatch() : ((typeof batches !== "undefined" && batches.length) ? batches[0] : null);
  const wrap = document.getElementById("inventoryTableWrap");
  if(!wrap || !batch) return;
  const title = document.getElementById("inventoryBatchTitle");
  const sub = document.getElementById("inventoryBatchSub");
  if(title) title.textContent = `${batch.owner}`;
  if(sub) sub.textContent = `批次：${batch.no}｜${batch.tag || ""}｜当前批次`;
  const q = (document.getElementById("inventorySearch")?.value || "").toLowerCase();
  let items = (batch.items || []).filter(item=>!q || String(item.name || "").toLowerCase().includes(q));
  if(!items.length){
    wrap.innerHTML = `<div class="inventory-empty">当前批次暂无批次商品。<br>请先继续入库添加货品。</div>`;
    document.getElementById("inventoryTotalIn").textContent = "0";
    document.getElementById("inventoryTotalSold").textContent = "0";
    document.getElementById("inventoryTotalRemain").textContent = "0";
    return;
  }
  let totalInQty = 0, totalInWeight = 0, totalSoldQty = 0, totalSoldWeight = 0, totalRemainQty = 0, totalRemainWeight = 0;
  wrap.innerHTML = `
    <table class="inventory-table">
      <thead><tr><th style="width:70px">序号</th><th>货品</th><th>入库量</th><th>销量</th><th>库存</th><th style="width:120px">操作</th></tr></thead>
      <tbody>
        ${items.map((item,index)=>{
          const c = getInventoryItemCalc(item);
          totalInQty += c.qty; totalInWeight += c.inWeight;
          totalSoldQty += c.sold; totalSoldWeight += c.soldWeight;
          totalRemainQty += c.remainQty; totalRemainWeight += c.remainWeight;
          const remainCls = c.remainQty < 0 || c.remainWeight < 0 ? "inventory-negative" : "inventory-positive";
          return `
            <tr>
              <td>${index + 1}</td>
              <td>
                <span class="inventory-name">${esc(item.name)}</span>
                <span class="inventory-badge">${item.pack === "定装" ? "定" : "非"}</span>
                <div class="inventory-sub">${esc(item.pack || "")}${item.pack === "定装" ? "｜" + esc(item.spec || 0) + "斤/" + esc(item.unit || "件") : ""}</div>
              </td>
              <td><div class="inventory-num">${formatInventoryAmount(c.qty, c.inWeight, c.unit)}</div></td>
              <td><div class="inventory-num">${formatInventoryAmount(c.sold, c.soldWeight, c.unit)}</div></td>
              <td><div class="inventory-num ${remainCls}">${formatInventoryAmount(c.remainQty, c.remainWeight, c.unit)}</div></td>
              <td><button class="inventory-btn-gray" onclick="exitInventoryViewToInbound()">开售</button></td>
            </tr>`;
        }).join("")}
      </tbody>
    </table>`;
  document.getElementById("inventoryTotalIn").textContent = `${totalInQty}件 / ${totalInWeight}斤`;
  document.getElementById("inventoryTotalSold").textContent = `${totalSoldQty}件 / ${totalSoldWeight}斤`;
  document.getElementById("inventoryTotalRemain").textContent = `${totalRemainQty}件 / ${totalRemainWeight}斤`;
}
if(typeof showAllStock === "function"){
  const oldShowAllStock = showAllStock;
  showAllStock = function(){ showInventoryView(); };
}
if(typeof confirmInbound === "function"){
  const oldConfirmInbound = confirmInbound;
  confirmInbound = function(){
    oldConfirmInbound();
    showInventoryView();
  };
}
setTimeout(()=>{
  document.querySelectorAll("button").forEach(btn=>{
    const txt = (btn.textContent || "").trim();
    if(txt === "查看批次") btn.onclick = showInventoryView;
    if(txt === "确认入库") btn.onclick = confirmInbound;
  });
},0);


/* ===== V29：稳定进入批次查看界面 ===== */
function showInventoryView(){
  document.body.classList.remove("show-cashier","show-orders");
  document.body.classList.add("show-inbound");
  document.body.classList.add("inventory-mode");
  renderInventoryView();
}

function exitInventoryViewToInbound(){
  document.body.classList.remove("inventory-mode");
  document.body.classList.remove("show-cashier","show-orders");
  document.body.classList.add("show-inbound");
  if(typeof renderAll === "function") renderAll();
}

if(typeof confirmInbound === "function"){
  const confirmInboundBeforeInventoryV29 = confirmInbound;
  confirmInbound = function(){
    confirmInboundBeforeInventoryV29();
    showInventoryView();
  };
}

setTimeout(()=>{
  document.querySelectorAll("button").forEach(btn=>{
    const txt = (btn.textContent || "").trim();
    if(txt === "查看批次"){
      btn.onclick = showInventoryView;
    }
    if(txt === "确认入库"){
      btn.onclick = confirmInbound;
    }
  });
},0);


/* ===== V30：批次确认入库后，货品才进入收银 ===== */
function ensureBatchConfirmFlags(){
  if(typeof batches === "undefined" || !Array.isArray(batches)) return;
  batches.forEach((b, idx)=>{
    // 原始默认演示批次视为已确认，避免打开后收银无商品；
    // 新增批次如果没有确认入库，会保持草稿，不进入收银。
    if(typeof b.confirmed === "undefined"){
      b.confirmed = idx === 0 ? true : false;
    }
  });
}

ensureBatchConfirmFlags();

function activeBatchSafe(){
  return (typeof activeBatch === "function") ? activeBatch() : (batches && batches[0]);
}

// 包装新增批次：新建批次默认为未确认
if(typeof saveBatch === "function"){
  const oldSaveBatchV30 = saveBatch;
  saveBatch = function(){
    oldSaveBatchV30();
    ensureBatchConfirmFlags();
    const b = activeBatchSafe();
    if(b && typeof b.confirmed === "undefined") b.confirmed = false;
    renderBatchConfirmStatus();
  };
}

// 包装确认入库：确认后该批次才进入收银
if(typeof confirmInbound === "function"){
  const oldConfirmInboundV30 = confirmInbound;
  confirmInbound = function(){
    const b = activeBatchSafe();
    if(b){
      b.confirmed = true;
      b.inboundConfirmedAt = new Date().toLocaleString("zh-CN",{hour12:false});
    }
    oldConfirmInboundV30();
    renderBatchConfirmStatus();
    if(typeof renderCashierAll === "function") renderCashierAll();
    toast("已确认入库，该批次货品已进入收银");
  };
}

function renderBatchConfirmStatus(){
  const b = activeBatchSafe();
  if(!b) return;
  const titleNodes = Array.from(document.querySelectorAll("h1,h2,.batch-title,.detail-title,.inventory-title h1"));
  titleNodes.forEach(node=>{
    if(!node || !node.textContent) return;
    if(node.dataset && node.dataset.confirmLabelDone === "1") return;
    if(node.textContent.includes(b.owner) || node.textContent.includes("批次")){
      const old = node.querySelector ? node.querySelector(".batch-draft-note,.batch-confirmed-note") : null;
      if(old) old.remove();
      if(node.insertAdjacentHTML){
        node.insertAdjacentHTML("beforeend", b.confirmed ? '<span class="batch-confirmed-note">已确认</span>' : '<span class="batch-draft-note">未确认</span>');
        node.dataset.confirmLabelDone = "1";
      }
    }
  });
}

// 只统计已确认批次的库存，供收银展示使用
function getConfirmedBatches(){
  ensureBatchConfirmFlags();
  return (batches || []).filter(b=>b.confirmed);
}

// 覆盖收银库存统计：未确认批次不参与
function getCashierStock(goodsId){
  let qty = 0;
  let weight = 0;
  getConfirmedBatches().forEach(b=>{
    b.items.forEach(i=>{
      if(i.goodsId === goodsId){
        const remainQty = Number(i.qty || 0) - Number(i.sold || 0);
        let soldWeight = Number(i.soldWeight || 0);
        const inWeight = Number(i.weight || 0);
        if(i.pack !== "定装" && remainQty <= 0 && inWeight > 0 && soldWeight < inWeight) soldWeight = inWeight;
        qty += remainQty;
        weight += i.pack === "定装" ? remainQty * Number(i.spec || 0) : Math.max(inWeight - soldWeight,0);
      }
    });
  });
  return {qty, weight};
}

// 覆盖收银商品列表：只有已确认入库的批次商品才显示
function getCashierProducts(skipLetterFilter){
  const q = (document.getElementById("cashierProductSearch")?.value || "").toLowerCase();
  const mode = document.getElementById("cashierProductMode")?.value || "";
  const selectedBatch = batches.find(b=>b.id === cashierSelectedBatch && b.confirmed);

  const stockedGoodsIds = new Set();
  getConfirmedBatches().forEach(b=>{
    b.items.forEach(i=>stockedGoodsIds.add(i.goodsId));
  });

  let products = goodsMaster
    .filter(g=>stockedGoodsIds.has(g.id))
    .map(g=>{
      const stock = getCashierStock(g.id);
      const relatedBatch = selectedBatch
        ? selectedBatch.items.find(i=>i.goodsId === g.id)
        : getConfirmedBatches().flatMap(b=>b.items.map(i=>({...i, batchNo:b.no, owner:b.owner}))).find(i=>i.goodsId === g.id);
      return {...g, stockQty:stock.qty, stockWeight:stock.weight, relatedBatch};
    });

  if(selectedBatch){
    const ids = new Set(selectedBatch.items.map(i=>i.goodsId));
    products = products.filter(g=>ids.has(g.id));
  }

  if(mode) products = products.filter(g=>g.pack === mode);

  if(!skipLetterFilter && typeof firstGoodsChar === "function" && cashierSelectedCat && cashierSelectedCat !== "全部"){
    products = products.filter(g=>firstGoodsChar(g.name) === cashierSelectedCat);
  }

  if(q) products = products.filter(g=>[g.name,g.category,g.pack].join(" ").toLowerCase().includes(q));

  return products;
}

// 覆盖收银批次列表：只显示已确认批次
function renderCashierBatches(){
  const box = document.getElementById("cashierBatchList");
  if(!box) return;
  const confirmed = getConfirmedBatches();
  if(!confirmed.length){
    box.innerHTML = `<div class="order-empty">暂无已确认批次。<br>请先到批次里点击“确认入库”。</div>`;
    return;
  }
  const cards = confirmed.map(b=>`
    <div class="cashier-batch-card ${cashierSelectedBatch===b.id?'active':''}" onclick="selectCashierBatch('${b.id}')">
      <b>${esc(b.owner)}</b>
      <span>${esc(b.no)}｜${esc(b.tag)}</span>
    </div>
  `).join("");
  box.innerHTML = cards;
}

// 如果当前选择的是未确认批次，收银自动回到全部
if(typeof selectCashierBatch === "function"){
  const oldSelectCashierBatchV30 = selectCashierBatch;
  selectCashierBatch = function(id){
    const b = batches.find(x=>x.id === id);
    if(b && !b.confirmed){
      cashierSelectedBatch = "";
      toast("该批次尚未确认入库，不能进入收银");
      renderCashierBatches();
      renderCashierProducts();
      return;
    }
    oldSelectCashierBatchV30(id);
  };
}

// 覆盖收银商品添加：只允许从已确认批次中找货
function findFirstBatchForGoods(goodsId){
  for(const b of getConfirmedBatches()){
    const item = b.items.find(i=>i.goodsId === goodsId);
    if(item) return {batchNo:b.no, owner:b.owner};
  }
  return {batchNo:"-", owner:"-"};
}

// 每次切回收银前刷新
if(typeof renderCashierAll === "function"){
  const oldRenderCashierAllV30 = renderCashierAll;
  renderCashierAll = function(){
    ensureBatchConfirmFlags();
    oldRenderCashierAllV30();
  };
}

setTimeout(()=>{
  ensureBatchConfirmFlags();
  renderBatchConfirmStatus();
  document.querySelectorAll("button").forEach(btn=>{
    const txt = (btn.textContent || "").trim();
    if(txt === "查看批次" || txt === "查看总库存"){
      btn.textContent = "查看批次";
    }
  });
},0);


/* ===== V31：独立批次模块逻辑 ===== */
let selectedStockBatchId = "all";

function stockConfirmedBatches(){
  if(typeof ensureBatchConfirmFlags === "function") ensureBatchConfirmFlags();
  return (typeof batches !== "undefined" ? batches : []).filter(b=>{
    const ownerSettled = b && (b.ownerSettled || b.ownerSettlementAt || b.saleStatus === "settled");
    return b.confirmed && !ownerSettled;
  });
}

function stockCalcItem(item){
  const qty = Number(item.qty || 0);
  const sold = Number(item.sold || 0);
  const spec = Number(item.spec || 0);
  const unit = item.unit || "件";
  const fixed = item.pack === "定装";
  const inWeight = fixed ? qty * spec : Number(item.weight || 0);
  let soldWeight = fixed ? sold * spec : Number(item.soldWeight || 0);
  const remainQty = qty - sold;
  if(!fixed && remainQty <= 0 && inWeight > 0 && soldWeight < inWeight) soldWeight = inWeight;
  const remainWeight = fixed ? remainQty * spec : inWeight - soldWeight;
  return {qty,sold,remainQty,inWeight,soldWeight,remainWeight,unit,fixed};
}

function stockAmountText(qty, weight, unit){
  return `${Number(qty || 0)}${esc(unit || "件")}<div class="stock-sub">(${Number(weight || 0)}斤)</div>`;
}

function stockBatchStoppedStep1(batch){
  return !!(batch && (batch.saleStopped || batch.soldOut || batch.saleStatus === "stopped" || batch.saleStatus === "soldout" || batch.salePaused || batch.settled || batch.closed));
}

function stockBatchSoldOutStep1(batch){
  return !!(batch && (batch.soldOut || batch.saleStatus === "soldout"));
}

function stockItemStoppedStep1(item, batch){
  return stockBatchStoppedStep1(batch) || !!(item && (item.saleStopped || item.saleStatus === "stopped" || item.salePaused || item.settled || item.closed));
}

function stockFindItemStep1(batchId, goodsId){
  const batch = (typeof batches !== "undefined" ? batches : []).find(b=>b && b.id === batchId);
  if(!batch) return {batch:null,item:null};
  const item = (batch.items || []).find(x=>x && String(x.goodsId || x.id || x.name || "") === String(goodsId));
  return {batch,item};
}

function stockToggleItemSaleStep1(batchId, goodsId){
  const found = stockFindItemStep1(batchId, goodsId);
  const batch = found.batch;
  const item = found.item;
  if(!batch || !item) return;
  if(stockBatchSoldOutStep1(batch)){
    alert("该批次已售完，不能单独开售货品。");
    return;
  }
  if(stockBatchStoppedStep1(batch)){
    batch.saleStopped = false;
    batch.saleStatus = "selling";
    batch.salePaused = false;
    item.saleStopped = false;
    item.saleStatus = "selling";
    if(typeof toast === "function") toast("批次已开售，收银台恢复显示");
    try{ if(typeof renderStockModule === "function") renderStockModule(); }catch(err){}
    try{ if(typeof renderCashierProducts === "function") renderCashierProducts(); }catch(err){}
    try{ if(typeof renderCashierBatches === "function") renderCashierBatches(); }catch(err){}
    try{ if(typeof renderInventoryStep1 === "function") renderInventoryStep1(); }catch(err){}
    try{ if(typeof tudou2SaveNow === "function") setTimeout(tudou2SaveNow, 0); }catch(err){}
    return;
  }
  if(item.saleStopped || item.saleStatus === "stopped"){
    item.saleStopped = false;
    item.saleStatus = "selling";
    if(typeof toast === "function") toast("货品已开售，收银台恢复显示");
  }else{
    item.saleStopped = true;
    item.saleStatus = "stopped";
    if(typeof toast === "function") toast("货品已停售，收银台不再显示");
  }
  try{ if(typeof renderStockModule === "function") renderStockModule(); }catch(err){}
  try{ if(typeof renderCashierProducts === "function") renderCashierProducts(); }catch(err){}
  try{ if(typeof renderCashierBatches === "function") renderCashierBatches(); }catch(err){}
  try{ if(typeof renderInventoryStep1 === "function") renderInventoryStep1(); }catch(err){}
  try{ if(typeof tudou2SaveNow === "function") setTimeout(tudou2SaveNow, 0); }catch(err){}
}

function renderStockModule(){
  const batchList = document.getElementById("stockBatchList");
  const tableWrap = document.getElementById("stockTableWrap");
  if(!batchList || !tableWrap) return;

  const batchQ = (document.getElementById("stockBatchSearch")?.value || "").toLowerCase();
  const goodsQ = (document.getElementById("stockGoodsSearch")?.value || "").toLowerCase();
  const confirmed = stockConfirmedBatches();

  let batchCards = confirmed.filter(b=>{
    return !batchQ || [b.owner,b.no,b.tag].join(" ").toLowerCase().includes(batchQ);
  });

  batchList.innerHTML = `
    <div class="stock-batch-card ${selectedStockBatchId==='all'?'active':''}" onclick="selectStockBatch('all')">
      <b>全部批次</b>
      <span>${confirmed.length} 个已确认批次</span>
      <span>汇总所有已入库可售库存</span>
    </div>
    ${batchCards.map(b=>`
      <div class="stock-batch-card ${selectedStockBatchId===b.id?'active':''}" onclick="selectStockBatch('${b.id}')">
        <b>${esc(b.owner)}</b>
        <span>批次：${esc(b.no)}｜${esc(b.tag || "")}</span>
        <span>${(b.items||[]).length} 种货品｜${b.inboundConfirmedAt ? "确认：" + esc(b.inboundConfirmedAt) : "已确认"}${stockBatchSoldOutStep1(b) ? "｜已售完" : stockBatchStoppedStep1(b) ? "｜已停售" : ""}</span>
      </div>
    `).join("")}
  `;

  let displayBatches = selectedStockBatchId === "all"
    ? confirmed
    : confirmed.filter(b=>b.id === selectedStockBatchId);

  if(selectedStockBatchId !== "all" && !displayBatches.length){
    selectedStockBatchId = "all";
    displayBatches = confirmed;
  }

  const title = document.getElementById("stockTitle");
  const sub = document.getElementById("stockSubTitle");
  if(selectedStockBatchId === "all"){
    if(title) title.textContent = "批次总览";
    if(sub) sub.textContent = "所有已确认批次的实时汇总。";
  }else{
    const b = displayBatches[0];
    if(title) title.textContent = b ? `${b.owner}` : "库存";
    if(sub) sub.textContent = b ? `批次：${b.no}｜${b.tag || ""}｜实时同步入库、已售、剩余` : "";
  }

  let rows = [];
  displayBatches.forEach(batch=>{
    (batch.items || []).forEach(item=>{
      if(goodsQ && !String(item.name || "").toLowerCase().includes(goodsQ)) return;
      rows.push({batch,item,calc:stockCalcItem(item)});
    });
  });

  let totalInQty=0,totalInWeight=0,totalSoldQty=0,totalSoldWeight=0,totalRemainQty=0,totalRemainWeight=0;
  rows.forEach(r=>{
    totalInQty += r.calc.qty; totalInWeight += r.calc.inWeight;
    totalSoldQty += r.calc.sold; totalSoldWeight += r.calc.soldWeight;
    totalRemainQty += r.calc.remainQty; totalRemainWeight += r.calc.remainWeight;
  });

  document.getElementById("stockSummaryBatches").textContent = displayBatches.length;
  document.getElementById("stockSummaryIn").textContent = `${totalInQty}件 / ${totalInWeight}斤`;
  document.getElementById("stockSummarySold").textContent = `${totalSoldQty}件 / ${totalSoldWeight}斤`;
  document.getElementById("stockSummaryRemain").textContent = `${totalRemainQty}件 / ${totalRemainWeight}斤`;

  if(!rows.length){
    tableWrap.innerHTML = `<div class="stock-empty">暂无库存。<br>批次确认入库后，货品会进入批次模块。</div>`;
    return;
  }

  tableWrap.innerHTML = `
    <table class="stock-table">
      <thead>
        <tr>
          <th style="width:70px">序号</th>
          <th>货品</th>
          <th>批次</th>
          <th>入库批次/入库量</th>
          <th>已售批次/已售量</th>
          <th>剩余批次/剩余库存</th>
          <th>状态</th>
          <th style="width:120px">操作</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((r,index)=>{
          const c = r.calc;
          const remainCls = c.remainQty < 0 || c.remainWeight < 0 ? "stock-negative" : "stock-positive";
          const stopped = stockItemStoppedStep1(r.item, r.batch);
          const state = stockBatchSoldOutStep1(r.batch) ? "已售完" : (stopped ? "已停售" : ((c.remainQty < 0 || c.remainWeight < 0) ? "超卖" : (c.remainQty === 0 || c.remainWeight === 0 ? "售完" : "有库存")));
          const opText = stopped ? "开售" : "停售";
          const opClass = stopped ? "inventory-step1-greenbtn" : "inventory-step1-orangebtn";
          return `
            <tr>
              <td>${index+1}</td>
              <td class="stock-col-product">
                <div class="stock-cell-main">
                  <div class="stock-cell-title-row">
                    <span class="stock-goods-name">${esc(r.item.name)}</span>
                    <span class="stock-tag">${r.item.pack === "定装" ? "定" : "非"}</span>
                  </div>
                  <div class="stock-cell-meta">${esc(r.item.pack || "")}${r.item.pack === "定装" ? "｜" + esc(r.item.spec || 0) + "斤/" + esc(r.item.unit || "件") : ""}</div>
                </div>
              </td>
              <td class="stock-col-batch">
                <div class="stock-batch-main">${esc(r.batch.owner)}</div>
                <div class="stock-batch-meta">${esc(r.batch.no)}${r.batch.tag ? "｜" + esc(r.batch.tag) : ""}</div>
              </td>
              <td><div class="stock-num">${stockAmountText(c.qty,c.inWeight,c.unit)}</div></td>
              <td><div class="stock-num">${stockAmountText(c.sold,c.soldWeight,c.unit)}</div></td>
              <td><div class="stock-num ${remainCls}">${stockAmountText(c.remainQty,c.remainWeight,c.unit)}</div></td>
              <td><b class="${remainCls}">${state}</b></td>
              <td><button type="button" class="inventory-step1-batch-op ${opClass}" onclick="event.stopPropagation();stockToggleItemSaleStep1('${esc(r.batch.id)}','${esc(r.item.goodsId || r.item.id || r.item.name || "")}')">${opText}</button></td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
}

function selectStockBatch(id){
  selectedStockBatchId = id;
  renderStockModule();
}

const previousShowAppPageV31 = typeof showAppPage === "function" ? showAppPage : null;
showAppPage = function(page){
  document.body.classList.remove("show-inbound","show-cashier","show-orders","show-stock");
  if(page === "stock"){
    document.body.classList.add("show-stock");
    renderStockModule();
  }else if(previousShowAppPageV31){
    previousShowAppPageV31(page);
  }
};

// 收银、订单、批次变动后，库存同步刷新
if(typeof confirmInbound === "function"){
  const oldConfirmInboundV31 = confirmInbound;
  confirmInbound = function(){
    oldConfirmInboundV31();
    renderStockModule();
  };
}
if(typeof confirmOrderFromCodeBill === "function"){
  const oldConfirmOrderFromCodeBillV31 = confirmOrderFromCodeBill;
  confirmOrderFromCodeBill = function(){
    oldConfirmOrderFromCodeBillV31();
    renderStockModule();
  };
}
if(typeof completeSettleOrder === "function"){
  const oldCompleteSettleOrderV31 = completeSettleOrder;
  completeSettleOrder = function(){
    oldCompleteSettleOrderV31();
    renderStockModule();
  };
}


/* ===== V32：清理重复导航图标 ===== */
function dedupeNavButtons(selector){
  document.querySelectorAll(selector).forEach(nav=>{
    const seen = new Set();
    Array.from(nav.children).forEach(child=>{
      const text = (child.textContent || "").trim();
      const onclick = child.getAttribute ? (child.getAttribute("onclick") || "") : "";
      const key = text + "|" + onclick;
      if(text && seen.has(key)){
        child.remove();
      }else{
        seen.add(key);
      }
    });
  });
}
setTimeout(()=>{
  dedupeNavButtons(".cashier-side,.cashier-nav,.stock-side,.orders-side");
},0);


/* ===== V33：强制修复入库侧边栏重复“批次” ===== */
function fixInboundSidebarBatchStock(){
  const navItems = Array.from(document.querySelectorAll(".side-item,.cashier-nav-btn,.stock-nav-btn,.orders-nav-btn,button,div"))
    .filter(el=>{
      const txt = (el.textContent || "").trim();
      return ["收银","买家","批次","库存","货主","报表"].includes(txt);
    });

  let batchCount = 0;
  navItems.forEach(el=>{
    const txt = (el.textContent || "").trim();
    if(txt === "批次"){
      batchCount += 1;
      if(batchCount === 2){
        el.textContent = "库存";
        el.onclick = function(){
          if(typeof showAppPage === "function") showAppPage("stock");
        };
      }
    }
  });
}

setTimeout(fixInboundSidebarBatchStock, 0);
setTimeout(fixInboundSidebarBatchStock, 300);
setTimeout(fixInboundSidebarBatchStock, 1000);

if(typeof renderAll === "function"){
  const oldRenderAllV33 = renderAll;
  renderAll = function(){
    oldRenderAllV33();
    fixInboundSidebarBatchStock();
  };
}


/* ===== V33：确保批次模块入口有效 ===== */
const previousShowAppPageV33 = typeof showAppPage === "function" ? showAppPage : null;
showAppPage = function(page){
  document.body.classList.remove("show-inbound","show-cashier","show-orders","show-stock");
  if(page === "stock"){
    document.body.classList.add("show-stock");
    if(typeof renderStockModule === "function") renderStockModule();
  }else if(previousShowAppPageV33){
    previousShowAppPageV33(page);
    fixInboundSidebarBatchStock();
  }
};


/* ===== V34：最终修复批次 / 库存导航跳转状态 ===== */
function setSidebarActiveByPage(page){
  // 入库页老侧边栏：收银 / 买家 / 批次 / 库存 / 货主 / 报表
  const sideItems = Array.from(document.querySelectorAll(".side-item"));
  const navTexts = sideItems.filter(el=>{
    const t = (el.textContent || "").trim();
    return ["收银","买家","批次","库存","货主","报表"].includes(t);
  });

  if(navTexts.length >= 5){
    // 先清理 active
    navTexts.forEach(el=>el.classList.remove("active"));

    // 去重并固定文字：第一个批次保留，第二个批次改库存
    let batchCount = 0;
    navTexts.forEach(el=>{
      const t = (el.textContent || "").trim();
      if(t === "批次"){
        batchCount += 1;
        if(batchCount === 2){
          el.textContent = "库存";
        }
      }
    });

    navTexts.forEach(el=>{
      const t = (el.textContent || "").trim();

      if(t === "收银"){
        el.onclick = ()=>showAppPage("cashier");
        if(page === "cashier") el.classList.add("active");
      }
      if(t === "批次"){
        el.onclick = ()=>showAppPage("inbound");
        if(page === "inbound") el.classList.add("active");
      }
      if(t === "库存"){
        el.onclick = ()=>showAppPage("stock");
        if(page === "stock") el.classList.add("active");
      }
      if(t === "订单"){
        el.onclick = ()=>showAppPage("orders");
        if(page === "orders") el.classList.add("active");
      }
    });
  }

  // 收银页侧边栏
  document.querySelectorAll(".cashier-nav-btn").forEach(btn=>{
    const t = (btn.textContent || "").trim();
    btn.classList.remove("active");
    if(t === "收银") btn.onclick = ()=>showAppPage("cashier");
    if(t === "批次") btn.onclick = ()=>showAppPage("inbound");
    if(t === "库存") btn.onclick = ()=>showAppPage("stock");
    if(t === "订单") btn.onclick = ()=>showAppPage("orders");
    if((page === "cashier" && t === "收银") ||
       (page === "inbound" && t === "批次") ||
       (page === "stock" && t === "库存") ||
       (page === "orders" && t === "订单")){
      btn.classList.add("active");
    }
  });

  // 库存页侧边栏
  document.querySelectorAll(".stock-nav-btn").forEach(btn=>{
    const t = (btn.textContent || "").trim();
    btn.classList.remove("active");
    if(t === "收银") btn.onclick = ()=>showAppPage("cashier");
    if(t === "批次") btn.onclick = ()=>showAppPage("inbound");
    if(t === "库存") btn.onclick = ()=>showAppPage("stock");
    if(t === "订单") btn.onclick = ()=>showAppPage("orders");
    if((page === "cashier" && t === "收银") ||
       (page === "inbound" && t === "批次") ||
       (page === "stock" && t === "库存") ||
       (page === "orders" && t === "订单")){
      btn.classList.add("active");
    }
  });

  // 订单页侧边栏
  document.querySelectorAll(".orders-nav-btn").forEach(btn=>{
    const t = (btn.textContent || "").trim();
    btn.classList.remove("active");
    if(t === "收银") btn.onclick = ()=>showAppPage("cashier");
    if(t === "批次" || t === "入库") btn.onclick = ()=>showAppPage("inbound");
    if(t === "库存") btn.onclick = ()=>showAppPage("stock");
    if(t === "订单") btn.onclick = ()=>showAppPage("orders");
    if((page === "cashier" && t === "收银") ||
       (page === "inbound" && (t === "批次" || t === "入库")) ||
       (page === "stock" && t === "库存") ||
       (page === "orders" && t === "订单")){
      btn.classList.add("active");
    }
  });
}

function normalizeInboundSidebarLabels(){
  const sideItems = Array.from(document.querySelectorAll(".side-item"));
  const visible = sideItems.filter(el=>{
    const t = (el.textContent || "").trim();
    return ["收银","买家","批次","库存","货主","报表"].includes(t);
  });
  let batchCount = 0;
  let stockCount = 0;
  visible.forEach(el=>{
    const t = (el.textContent || "").trim();
    if(t === "批次"){
      batchCount += 1;
      if(batchCount === 2){
        el.textContent = "库存";
      }
    }
    if(t === "库存"){
      stockCount += 1;
      if(stockCount > 1){
        // 如果已经有库存，又遇到重复库存，优先把前一个重复位置还原成批次
        // 但不删除节点，避免布局跳动。
      }
    }
  });
}

// 最终 showAppPage：清楚切换四个主页面，不再叠加旧状态。
showAppPage = function(page){
  document.body.classList.remove("show-inbound","show-cashier","show-orders","show-stock","inventory-mode");

  if(page === "cashier"){
    document.body.classList.add("show-cashier");
    if(typeof renderCashierAll === "function") renderCashierAll();
    setSidebarActiveByPage("cashier");
    return;
  }

  if(page === "orders"){
    document.body.classList.add("show-orders");
    if(typeof renderOrdersCenter === "function") renderOrdersCenter();
    setSidebarActiveByPage("orders");
    return;
  }

  if(page === "stock"){
    document.body.classList.add("show-stock");
    if(typeof renderStockModule === "function") renderStockModule();
    setSidebarActiveByPage("stock");
    return;
  }

  // 默认：批次页
  document.body.classList.add("show-inbound");
  if(typeof renderAll === "function") renderAll();
  normalizeInboundSidebarLabels();
  setSidebarActiveByPage("inbound");
};

setTimeout(()=>{
  normalizeInboundSidebarLabels();
  setSidebarActiveByPage(document.body.classList.contains("show-stock") ? "stock" :
                         document.body.classList.contains("show-cashier") ? "cashier" :
                         document.body.classList.contains("show-orders") ? "orders" : "inbound");
},0);
setTimeout(()=>{
  normalizeInboundSidebarLabels();
  setSidebarActiveByPage(document.body.classList.contains("show-stock") ? "stock" :
                         document.body.classList.contains("show-cashier") ? "cashier" :
                         document.body.classList.contains("show-orders") ? "orders" : "inbound");
},500);


/* ===== V35：库存页导航强制重建，彻底去掉两个库存 ===== */
function rebuildStockSidebarV35(){
  document.querySelectorAll(".stock-side").forEach(side=>{
    side.innerHTML = `
      <div class="stock-logo">仓頡</div>
      <button class="stock-nav-btn" onclick="showAppPage('cashier')">收银</button>
      <button class="stock-nav-btn" onclick="showAppPage('inbound')">入库</button>
      <button class="stock-nav-btn active" onclick="showAppPage('stock')">库存</button>
      <button class="stock-nav-btn" onclick="showAppPage('orders')">订单</button>
      <button class="stock-nav-btn" onclick="alert('客户模块下一阶段接入')">客户</button>
      <button class="stock-nav-btn" onclick="alert('报表模块下一阶段接入')">报表</button>
    `;
  });
}

function setStockSidebarActiveV35(page){
  document.querySelectorAll(".stock-nav-btn").forEach(btn=>{
    const t = (btn.textContent || "").trim();
    btn.classList.remove("active");
    if(t === "收银") btn.onclick = ()=>showAppPage("cashier");
    if(t === "批次") btn.onclick = ()=>showAppPage("inbound");
    if(t === "库存") btn.onclick = ()=>showAppPage("stock");
    if(t === "订单") btn.onclick = ()=>showAppPage("orders");
    if((page === "cashier" && t === "收银") ||
       (page === "inbound" && t === "批次") ||
       (page === "stock" && t === "库存") ||
       (page === "orders" && t === "订单")){
      btn.classList.add("active");
    }
  });
}

const previousShowAppPageV35 = typeof showAppPage === "function" ? showAppPage : null;
showAppPage = function(page){
  document.body.classList.remove("show-inbound","show-cashier","show-orders","show-stock","inventory-mode");

  if(page === "stock"){
    document.body.classList.add("show-stock");
    rebuildStockSidebarV35();
    if(typeof renderStockModule === "function") renderStockModule();
    setStockSidebarActiveV35("stock");
    return;
  }

  if(previousShowAppPageV35){
    previousShowAppPageV35(page);
  }

  if(page === "inbound"){
    setTimeout(()=>setStockSidebarActiveV35("inbound"),0);
  }
};

setTimeout(rebuildStockSidebarV35,0);
setTimeout(rebuildStockSidebarV35,300);


/* ===== V36：修复收银端“入库”按钮跳转 ===== */
function v36FixAllNavButtons(){
  // 收银端侧边栏：入库按钮必须进入当前批次/入库界面
  document.querySelectorAll(".cashier-nav-btn").forEach(btn=>{
    const t = (btn.textContent || "").trim();
    btn.classList.remove("active");

    if(t === "收银"){
      btn.onclick = ()=>showAppPage("cashier");
      if(document.body.classList.contains("show-cashier")) btn.classList.add("active");
    }

    if(t === "入库" || t === "批次"){
      btn.textContent = "入库";
      btn.onclick = ()=>showAppPage("inbound");
      if(document.body.classList.contains("show-inbound")) btn.classList.add("active");
    }

    if(t === "库存"){
      btn.onclick = ()=>showAppPage("stock");
      if(document.body.classList.contains("show-stock")) btn.classList.add("active");
    }

    if(t === "订单"){
      btn.onclick = ()=>showAppPage("orders");
      if(document.body.classList.contains("show-orders")) btn.classList.add("active");
    }
  });

  // 入库/批次页老侧边栏：保持“批次”和“库存”分开
  const sideItems = Array.from(document.querySelectorAll(".side-item"));
  const navItems = sideItems.filter(el=>{
    const t = (el.textContent || "").trim();
    return ["收银","买家","批次","库存","货主","报表","入库"].includes(t);
  });

  let batchSeen = 0;
  navItems.forEach(el=>{
    const t = (el.textContent || "").trim();

    if(t === "收银"){
      el.onclick = ()=>showAppPage("cashier");
    }

    if(t === "入库"){
      el.textContent = "批次";
      el.onclick = ()=>showAppPage("inbound");
    }

    if((el.textContent || "").trim() === "批次"){
      batchSeen += 1;
      if(batchSeen === 1){
        el.onclick = ()=>showAppPage("inbound");
      }else{
        el.textContent = "库存";
        el.onclick = ()=>showAppPage("stock");
      }
    }

    if((el.textContent || "").trim() === "库存"){
      el.onclick = ()=>showAppPage("stock");
    }
  });

  // 库存页侧边栏固定
  document.querySelectorAll(".stock-nav-btn").forEach(btn=>{
    const t = (btn.textContent || "").trim();
    if(t === "收银") btn.onclick = ()=>showAppPage("cashier");
    if(t === "批次" || t === "入库") btn.onclick = ()=>showAppPage("inbound");
    if(t === "库存") btn.onclick = ()=>showAppPage("stock");
    if(t === "订单") btn.onclick = ()=>showAppPage("orders");
  });

  // 订单页侧边栏固定
  document.querySelectorAll(".orders-nav-btn").forEach(btn=>{
    const t = (btn.textContent || "").trim();
    if(t === "收银") btn.onclick = ()=>showAppPage("cashier");
    if(t === "批次" || t === "入库") btn.onclick = ()=>showAppPage("inbound");
    if(t === "库存") btn.onclick = ()=>showAppPage("stock");
    if(t === "订单") btn.onclick = ()=>showAppPage("orders");
  });
}

// 最终页面跳转：入库/批次统一进入当前确认过的批次入库界面
const previousShowAppPageV36 = typeof showAppPage === "function" ? showAppPage : null;
showAppPage = function(page){
  document.body.classList.remove("show-inbound","show-cashier","show-orders","show-stock","inventory-mode");

  if(page === "cashier"){
    document.body.classList.add("show-cashier");
    if(typeof renderCashierAll === "function") renderCashierAll();
    v36FixAllNavButtons();
    return;
  }

  if(page === "stock"){
    document.body.classList.add("show-stock");
    if(typeof rebuildStockSidebarV35 === "function") rebuildStockSidebarV35();
    if(typeof renderStockModule === "function") renderStockModule();
    v36FixAllNavButtons();
    return;
  }

  if(page === "orders"){
    document.body.classList.add("show-orders");
    if(typeof renderOrdersCenter === "function") renderOrdersCenter();
    v36FixAllNavButtons();
    return;
  }

  // 入库按钮、批次按钮，都统一回到当前批次/入库界面
  document.body.classList.add("show-inbound");
  if(typeof renderAll === "function") renderAll();
  v36FixAllNavButtons();
};

setTimeout(v36FixAllNavButtons,0);
setTimeout(v36FixAllNavButtons,300);
setTimeout(v36FixAllNavButtons,1000);


/* ===== V37：最终统一导航，彻底解决入库/库存跳转错乱 ===== */
function v37Go(page){
  document.body.classList.remove(
    "show-inbound",
    "show-cashier",
    "show-orders",
    "show-stock",
    "inventory-mode"
  );

  if(page === "cashier"){
    document.body.classList.add("show-cashier");
    if(typeof renderCashierAll === "function") renderCashierAll();
  }else if(page === "stock"){
    document.body.classList.add("show-stock");
    if(typeof rebuildStockSidebarV35 === "function") rebuildStockSidebarV35();
    if(typeof renderStockModule === "function") renderStockModule();
  }else if(page === "orders"){
    document.body.classList.add("show-orders");
    if(typeof renderOrdersCenter === "function") renderOrdersCenter();
  }else{
    // 入库按钮只回到当前入库/批次录入界面
    document.body.classList.add("show-inbound");
    if(typeof renderAll === "function") renderAll();
  }

  setTimeout(()=>v37RebuildAllSidebars(page),0);
}

function v37SidebarHtml(activePage, type){
  const is = (p)=>activePage === p ? " active" : "";
  const btnClass = type === "stock" ? "stock-nav-btn" : (type === "orders" ? "orders-nav-btn" : "cashier-nav-btn");
  return `
    <div class="${type === "stock" ? "stock-logo" : (type === "orders" ? "orders-logo" : "cashier-logo")}">仓頡</div>
    <button class="${btnClass}${is("cashier")}" onclick="v37Go('cashier')">收银</button>
    <button class="${btnClass}${is("inbound")}" onclick="v37Go('inbound')">入库</button>
    <button class="${btnClass}${is("stock")}" onclick="v37Go('stock')">库存</button>
    <button class="${btnClass}${is("orders")}" onclick="v37Go('orders')">订单</button>
    <button class="${btnClass}" onclick="alert('客户模块下一阶段接入')">客户</button>
    <button class="${btnClass}" onclick="alert('报表模块下一阶段接入')">报表</button>
  `;
}

function v37RebuildAllSidebars(activePage){
  // 收银页导航
  document.querySelectorAll(".cashier-side").forEach(side=>{
    side.innerHTML = v37SidebarHtml(activePage, "cashier");
  });

  // 库存页导航
  document.querySelectorAll(".stock-side").forEach(side=>{
    side.innerHTML = v37SidebarHtml(activePage, "stock");
  });

  // 订单页导航
  document.querySelectorAll(".orders-side").forEach(side=>{
    side.innerHTML = v37SidebarHtml(activePage, "orders");
  });

  // 入库页老导航：这个项目里老导航可能不是 .cashier-side，而是由 side-item 组成。
  const sideItems = Array.from(document.querySelectorAll(".side-item"));
  if(sideItems.length){
    const parent = sideItems[0].parentElement;
    if(parent){
      parent.innerHTML = `
        <div class="side-logo">仓頡</div>
        <div class="side-item ${activePage === "cashier" ? "active" : ""}" onclick="v37Go('cashier')">收银</div>
        <div class="side-item ${activePage === "inbound" ? "active" : ""}" onclick="v37Go('inbound')">入库</div>
        <div class="side-item ${activePage === "stock" ? "active" : ""}" onclick="v37Go('stock')">库存</div>
        <div class="side-item ${activePage === "orders" ? "active" : ""}" onclick="v37Go('orders')">订单</div>
        <div class="side-item" onclick="alert('客户模块下一阶段接入')">客户</div>
        <div class="side-item" onclick="alert('报表模块下一阶段接入')">报表</div>
      `;
    }
  }

  // 兜底：所有按钮文字重新绑定
  document.querySelectorAll("button,.side-item").forEach(el=>{
    const txt = (el.textContent || "").trim();
    if(txt === "收银") el.onclick = ()=>v37Go("cashier");
    if(txt === "入库" || txt === "批次") el.onclick = ()=>v37Go("inbound");
    if(txt === "库存") el.onclick = ()=>v37Go("stock");
    if(txt === "订单") el.onclick = ()=>v37Go("orders");
  });
}

// 覆盖系统旧 showAppPage，避免旧函数再把页面带乱
showAppPage = function(page){
  if(page === "batch") page = "inbound";
  if(page === "inventory") page = "stock";
  v37Go(page);
};

// 页面加载后，按当前页面状态重建导航
function v37DetectCurrentPage(){
  if(document.body.classList.contains("show-stock")) return "stock";
  if(document.body.classList.contains("show-orders")) return "orders";
  if(document.body.classList.contains("show-cashier")) return "cashier";
  return "inbound";
}

setTimeout(()=>v37RebuildAllSidebars(v37DetectCurrentPage()),0);
setTimeout(()=>v37RebuildAllSidebars(v37DetectCurrentPage()),300);
setTimeout(()=>v37RebuildAllSidebars(v37DetectCurrentPage()),1000);


/* ===== V38：导航高亮与当前页面强制同步 ===== */
function v38CurrentPage(){
  if(document.body.classList.contains("show-stock")) return "stock";
  if(document.body.classList.contains("show-orders")) return "orders";
  if(document.body.classList.contains("show-inbound")) return "inbound";
  return "cashier";
}

function v38LabelToPage(text){
  const t = String(text || "").trim();
  if(t === "收银") return "cashier";
  if(t === "入库" || t === "批次") return "inbound";
  if(t === "库存") return "stock";
  if(t === "订单") return "orders";
  return "";
}

function v38SyncNavActive(page){
  page = page || v38CurrentPage();

  const navs = Array.from(document.querySelectorAll(
    ".side-item,.cashier-nav-btn,.stock-nav-btn,.orders-nav-btn"
  ));

  navs.forEach(el=>{
    const txt = (el.textContent || "").trim();
    const target = v38LabelToPage(txt);

    el.classList.remove("active");

    if(target){
      el.onclick = function(){
        v38Go(target);
      };
      if(target === page){
        el.classList.add("active");
      }
    }
  });
}

function v38Go(page){
  document.body.classList.remove("show-inbound","show-cashier","show-orders","show-stock","inventory-mode");

  if(page === "cashier"){
    document.body.classList.add("show-cashier");
    if(typeof renderCashierAll === "function") renderCashierAll();
  }else if(page === "inbound"){
    document.body.classList.add("show-inbound");
    if(typeof renderAll === "function") renderAll();
  }else if(page === "stock"){
    document.body.classList.add("show-stock");
    if(typeof renderStockModule === "function") renderStockModule();
  }else if(page === "orders"){
    document.body.classList.add("show-orders");
    if(typeof renderOrdersCenter === "function") renderOrdersCenter();
  }else{
    document.body.classList.add("show-cashier");
    if(typeof renderCashierAll === "function") renderCashierAll();
    page = "cashier";
  }

  setTimeout(()=>v38SyncNavActive(page),0);
  setTimeout(()=>v38SyncNavActive(page),80);
}

// 覆盖旧 showAppPage，避免旧 active 状态残留
showAppPage = function(page){
  if(page === "batch") page = "inbound";
  if(page === "inventory") page = "stock";
  v38Go(page);
};

// 包装常用渲染函数：每次渲染后重新同步高亮
if(typeof renderCashierAll === "function"){
  const oldRenderCashierAllV38 = renderCashierAll;
  renderCashierAll = function(){
    oldRenderCashierAllV38();
    setTimeout(()=>v38SyncNavActive("cashier"),0);
  };
}

if(typeof renderAll === "function"){
  const oldRenderAllV38 = renderAll;
  renderAll = function(){
    oldRenderAllV38();
    setTimeout(()=>v38SyncNavActive("inbound"),0);
  };
}

if(typeof renderStockModule === "function"){
  const oldRenderStockModuleV38 = renderStockModule;
  renderStockModule = function(){
    oldRenderStockModuleV38();
    setTimeout(()=>v38SyncNavActive("stock"),0);
  };
}

if(typeof renderOrdersCenter === "function"){
  const oldRenderOrdersCenterV38 = renderOrdersCenter;
  renderOrdersCenter = function(){
    oldRenderOrdersCenterV38();
    setTimeout(()=>v38SyncNavActive("orders"),0);
  };
}

setTimeout(()=>v38SyncNavActive(v38CurrentPage()),0);
setTimeout(()=>v38SyncNavActive(v38CurrentPage()),300);
setTimeout(()=>v38SyncNavActive(v38CurrentPage()),1000);


/* ===== V39：入库页字体兜底统一 ===== */
function v39NormalizeInboundFonts(){
  document.querySelectorAll("#inboundRoot *").forEach(el=>{
    el.style.fontFamily = '-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",Arial,sans-serif';
  });
}
setTimeout(v39NormalizeInboundFonts,0);
setTimeout(v39NormalizeInboundFonts,300);
setTimeout(v39NormalizeInboundFonts,1000);

if(typeof renderAll === "function"){
  const oldRenderAllV39 = renderAll;
  renderAll = function(){
    oldRenderAllV39();
    setTimeout(v39NormalizeInboundFonts,0);
  };
}


/* ===== V40：三页导航、样式、状态统一 ===== */
function v40CurrentPage(){
  if(document.body.classList.contains("show-stock")) return "stock";
  if(document.body.classList.contains("show-orders")) return "orders";
  if(document.body.classList.contains("show-inbound")) return "inbound";
  return "cashier";
}

function v40SyncNav(page){
  page = page || v40CurrentPage();
  const labelToPage = {"收银":"cashier","入库":"inbound","批次":"inbound","库存":"stock","订单":"orders"};
  document.querySelectorAll('.side-item,.cashier-nav-btn,.stock-nav-btn,.orders-nav-btn').forEach(el=>{
    const txt = (el.textContent || '').trim();
    const target = labelToPage[txt] || '';
    el.classList.remove('active');
    if(target){
      el.onclick = function(){ showAppPage(target); };
      if(target === page) el.classList.add('active');
    }
  });
}

showAppPage = function(page){
  if(page === 'batch') page = 'inbound';
  if(page === 'inventory') page = 'stock';

  document.body.classList.remove('show-inbound','show-cashier','show-stock','show-orders','inventory-mode');

  if(page === 'cashier'){
    document.body.classList.add('show-cashier');
    if(typeof renderCashierAll === 'function') renderCashierAll();
  }else if(page === 'stock'){
    document.body.classList.add('show-stock');
    if(typeof renderStockModule === 'function') renderStockModule();
  }else if(page === 'orders'){
    document.body.classList.add('show-orders');
    if(typeof renderOrdersCenter === 'function') renderOrdersCenter();
  }else{
    page = 'inbound';
    document.body.classList.add('show-inbound');
    if(typeof renderAll === 'function') renderAll();
  }

  setTimeout(()=>v40SyncNav(page),0);
  setTimeout(()=>v40SyncNav(page),100);
};

function v40ForceInboundSync(){
  const invBtn = document.querySelector('#inboundRoot .btn-gray');
  if(invBtn && /查看/.test(invBtn.textContent||'')){
    invBtn.textContent = '查看批次';
    invBtn.onclick = function(){ showAppPage('stock'); };
  }
  v40SyncNav(v40CurrentPage());
}

if(typeof renderAll === 'function'){
  const __oldRenderAllV40 = renderAll;
  renderAll = function(){
    __oldRenderAllV40();
    setTimeout(v40ForceInboundSync,0);
  };
}
if(typeof renderCashierAll === 'function'){
  const __oldRenderCashierAllV40 = renderCashierAll;
  renderCashierAll = function(){
    __oldRenderCashierAllV40();
    setTimeout(()=>v40SyncNav('cashier'),0);
  };
}
if(typeof renderStockModule === 'function'){
  const __oldRenderStockModuleV40 = renderStockModule;
  renderStockModule = function(){
    __oldRenderStockModuleV40();
    setTimeout(()=>v40SyncNav('stock'),0);
  };
}
if(typeof renderOrdersCenter === 'function'){
  const __oldRenderOrdersCenterV40 = renderOrdersCenter;
  renderOrdersCenter = function(){
    __oldRenderOrdersCenterV40();
    setTimeout(()=>v40SyncNav('orders'),0);
  };
}

setTimeout(v40ForceInboundSync,0);
setTimeout(v40ForceInboundSync,300);
setTimeout(v40ForceInboundSync,1000);


/* ===== V41：全局统一左侧导航最终控制 ===== */
function v41SetActive(page){
  document.querySelectorAll("#globalUnifiedNavV41 .v41-nav-btn").forEach(btn=>{
    btn.classList.remove("active");
    if(btn.dataset.page === page){
      btn.classList.add("active");
    }
  });
}

function v41ShowOnly(page){
  if(page === "batch") page = "inbound";
  if(page === "inventory") page = "stock";
  if(!["cashier","inbound","stock","orders"].includes(page)){
    page = "cashier";
  }

  document.body.classList.remove("show-cashier","show-inbound","show-stock","show-orders","inventory-mode");
  document.body.classList.add("show-" + page);

  if(page === "cashier" && typeof renderCashierAll === "function"){
    renderCashierAll();
  }
  if(page === "inbound" && typeof renderAll === "function"){
    renderAll();
  }
  if(page === "stock" && typeof renderStockModule === "function"){
    renderStockModule();
  }
  if(page === "orders" && typeof renderOrdersCenter === "function"){
    renderOrdersCenter();
  }

  v41SetActive(page);
}

// 覆盖所有旧跳转函数
showAppPage = function(page){
  v41ShowOnly(page);
};

// 把旧页面里可能存在的“查看批次/查看批次”按钮也统一到库存页
function v41CleanOldButtons(){
  document.querySelectorAll("button,.side-item,.cashier-nav-btn,.stock-nav-btn,.orders-nav-btn").forEach(el=>{
    const t = (el.textContent || "").trim();

    // 原各页面旧导航会被隐藏，这里只兜底防止旧按钮误触
    if(t === "收银") el.onclick = ()=>showAppPage("cashier");
    if(t === "入库" || t === "批次") el.onclick = ()=>showAppPage("inbound");
    if(t === "库存" || t === "批次") el.onclick = ()=>showAppPage("stock");
    if(t === "订单") el.onclick = ()=>showAppPage("orders");

    if(t === "查看批次" || t === "查看批次" || t === "查看总库存"){
      el.textContent = "查看批次";
      el.onclick = ()=>showAppPage("stock");
    }
  });
}

if(typeof renderAll === "function"){
  const oldRenderAllV41 = renderAll;
  renderAll = function(){
    oldRenderAllV41();
    setTimeout(v41CleanOldButtons,0);
    setTimeout(()=>v41SetActive("inbound"),0);
  };
}
if(typeof renderCashierAll === "function"){
  const oldRenderCashierAllV41 = renderCashierAll;
  renderCashierAll = function(){
    oldRenderCashierAllV41();
    setTimeout(v41CleanOldButtons,0);
    setTimeout(()=>v41SetActive("cashier"),0);
  };
}
if(typeof renderStockModule === "function"){
  const oldRenderStockModuleV41 = renderStockModule;
  renderStockModule = function(){
    oldRenderStockModuleV41();
    setTimeout(v41CleanOldButtons,0);
    setTimeout(()=>v41SetActive("stock"),0);
  };
}
if(typeof renderOrdersCenter === "function"){
  const oldRenderOrdersCenterV41 = renderOrdersCenter;
  renderOrdersCenter = function(){
    oldRenderOrdersCenterV41();
    setTimeout(v41CleanOldButtons,0);
    setTimeout(()=>v41SetActive("orders"),0);
  };
}

// 首次打开默认保持收银页；如果旧代码已经带了状态，也同步当前状态
function v41InitialPage(){
  if(document.body.classList.contains("show-inbound")) return "inbound";
  if(document.body.classList.contains("show-stock")) return "stock";
  if(document.body.classList.contains("show-orders")) return "orders";
  return "cashier";
}

setTimeout(()=>{
  v41CleanOldButtons();
  v41ShowOnly(v41InitialPage());
},0);
setTimeout(()=>{
  v41CleanOldButtons();
  v41SetActive(v41InitialPage());
},300);
setTimeout(()=>{
  v41CleanOldButtons();
  v41SetActive(v41InitialPage());
},1000);


/* ===== V42：创建批次入口 ===== */
function createBatchFromStock(){
  // 批次来源于批次确认入库，所以点击创建批次会进入入库并新建批次。
  showAppPage("inbound");
  setTimeout(()=>{
    if(typeof addBatch === "function"){
      addBatch();
    }
  },80);
}

/* V42：让旧的“库存”判断同时兼容 批次 */
function v42Patch批次Nav(){
  document.querySelectorAll("#globalUnifiedNavV41 .v41-nav-btn").forEach(btn=>{
    if(btn.dataset && btn.dataset.page === "stock"){
      btn.textContent = "批次";
    }
  });

  document.querySelectorAll("button,.side-item,.cashier-nav-btn,.stock-nav-btn,.orders-nav-btn").forEach(el=>{
    const t = (el.textContent || "").trim();
    if(t === "批次" || t === "库存"){
      el.onclick = ()=>showAppPage("stock");
      if(t === "库存" && el.closest("#globalUnifiedNavV41")){
        el.textContent = "批次";
      }
    }
    if(t === "查看库存"){
      el.textContent = "查看批次";
      el.onclick = ()=>showAppPage("stock");
    }
  });
}

const oldV41SetActiveV42 = typeof v41SetActive === "function" ? v41SetActive : null;
if(oldV41SetActiveV42){
  v41SetActive = function(page){
    oldV41SetActiveV42(page);
    v42Patch批次Nav();
  };
}

setTimeout(v42Patch批次Nav,0);
setTimeout(v42Patch批次Nav,300);
setTimeout(v42Patch批次Nav,1000);


/* ===== V43：批次命名修正 ===== */
function createBatchFromStock(){
  showAppPage("inbound");
  setTimeout(()=>{
    if(typeof addBatch === "function"){
      addBatch();
    }
  },80);
}

function v43PatchBatchNav(){
  document.querySelectorAll("#globalUnifiedNavV41 .v41-nav-btn").forEach(btn=>{
    if(btn.dataset && btn.dataset.page === "stock"){
      btn.textContent = "批次";
    }
  });

  document.querySelectorAll("button,.side-item,.cashier-nav-btn,.stock-nav-btn,.orders-nav-btn").forEach(el=>{
    const t = (el.textContent || "").trim();

    if(t === "查看库存"){
      el.textContent = "查看批次";
      el.onclick = ()=>showAppPage("stock");
    }

    if(t === "批次" && el.closest("#globalUnifiedNavV41")){
      el.onclick = ()=>showAppPage("stock");
    }
  });
}

setTimeout(v43PatchBatchNav,0);
setTimeout(v43PatchBatchNav,300);
setTimeout(v43PatchBatchNav,1000);


/* ===== V44：批次总览中收纳创建批次/入库完整流程 ===== */
let batchCreateModeV44 = false;

function openBatchCreateFlow(){
  // 从批次总览进入“创建批次”，显示原完整入库框架。
  batchCreateModeV44 = true;
  document.body.classList.remove("show-cashier","show-stock","show-orders","inventory-mode","batch-overview-mode");
  document.body.classList.add("show-inbound","batch-create-mode");

  if(typeof renderAll === "function"){
    renderAll();
  }

  setTimeout(()=>{
    if(typeof addBatch === "function"){
      addBatch();
    }
    v44PatchCreateFlowButtons();
    v44SetGlobalActive("stock");
  },80);
}

function closeBatchCreateFlowToOverview(){
  // 从创建批次返回批次总览。
  batchCreateModeV44 = false;
  document.body.classList.remove("show-cashier","show-inbound","show-orders","inventory-mode","batch-create-mode");
  document.body.classList.add("show-stock","batch-overview-mode");

  if(typeof renderStockModule === "function"){
    renderStockModule();
  }

  setTimeout(()=>{
    v44PatchBatchOverview();
    v44SetGlobalActive("stock");
  },0);
}

function v44SetGlobalActive(page){
  document.querySelectorAll("#globalUnifiedNavV41 .v41-nav-btn").forEach(btn=>{
    btn.classList.remove("active");
    if(btn.dataset.page === page){
      btn.classList.add("active");
    }
  });
}

function v44PatchBatchOverview(){
  // 批次总览页：按钮叫创建批次，点击后进入创建流程。
  const createBtn = document.getElementById("createBatchBtn");
  if(createBtn){
    createBtn.textContent = "创建批次";
    createBtn.onclick = openBatchCreateFlow;
  }

  document.querySelectorAll("#globalUnifiedNavV41 .v41-nav-btn").forEach(btn=>{
    if(btn.dataset.page === "stock"){
      btn.textContent = "批次";
      btn.onclick = ()=>showAppPage("stock");
    }
    if(btn.dataset.page === "inbound"){
      // 如果旧按钮还残留，隐藏它，避免把创建流程当成主页面。
      btn.style.display = "none";
    }
  });
}

function v44PatchCreateFlowButtons(){
  // 创建批次流程里保留完整入库框架，但“返回”回到批次总览。
  document.querySelectorAll("#inboundRoot .back").forEach(el=>{
    el.textContent = "← 返回批次";
    el.onclick = closeBatchCreateFlowToOverview;
  });

  document.querySelectorAll("#inboundRoot button").forEach(btn=>{
    const txt = (btn.textContent || "").trim();
    if(txt === "查看库存" || txt === "查看批次" || txt === "查看总库存"){
      btn.textContent = "返回批次";
      btn.onclick = closeBatchCreateFlowToOverview;
    }
  });
}

// 覆盖创建按钮函数名，避免旧逻辑直接跳入入库造成状态不清。
function createBatchFromStock(){
  openBatchCreateFlow();
}

// 覆盖 showAppPage：批次 = 总览；创建批次才进入入库框架。
showAppPage = function(page){
  if(page === "batch" || page === "inventory") page = "stock";

  document.body.classList.remove(
    "show-cashier",
    "show-inbound",
    "show-stock",
    "show-orders",
    "inventory-mode",
    "batch-create-mode",
    "batch-overview-mode"
  );

  if(page === "cashier"){
    batchCreateModeV44 = false;
    document.body.classList.add("show-cashier");
    if(typeof renderCashierAll === "function") renderCashierAll();
    v44SetGlobalActive("cashier");
    return;
  }

  if(page === "orders"){
    batchCreateModeV44 = false;
    document.body.classList.add("show-orders");
    if(typeof renderOrdersCenter === "function") renderOrdersCenter();
    v44SetGlobalActive("orders");
    return;
  }

  if(page === "inbound"){
    // 不再把入库作为独立主页面；如果旧代码调用 inbound，就进入创建批次流程。
    openBatchCreateFlow();
    return;
  }

  // 默认进入批次总览。
  batchCreateModeV44 = false;
  document.body.classList.add("show-stock","batch-overview-mode");
  if(typeof renderStockModule === "function") renderStockModule();
  v44PatchBatchOverview();
  v44SetGlobalActive("stock");
};

// 确认入库后回到批次总览
if(typeof confirmInbound === "function"){
  const oldConfirmInboundV44 = confirmInbound;
  confirmInbound = function(){
    oldConfirmInboundV44();
    closeBatchCreateFlowToOverview();
  };
}

// 渲染后修补按钮
if(typeof renderAll === "function"){
  const oldRenderAllV44 = renderAll;
  renderAll = function(){
    oldRenderAllV44();
    if(batchCreateModeV44){
      setTimeout(v44PatchCreateFlowButtons,0);
    }
  };
}

if(typeof renderStockModule === "function"){
  const oldRenderStockModuleV44 = renderStockModule;
  renderStockModule = function(){
    oldRenderStockModuleV44();
    setTimeout(v44PatchBatchOverview,0);
  };
}

setTimeout(()=>{
  v44PatchBatchOverview();
  v44SetGlobalActive(document.body.classList.contains("show-cashier") ? "cashier" :
                     document.body.classList.contains("show-orders") ? "orders" : "stock");
},0);
setTimeout(v44PatchBatchOverview,300);
setTimeout(v44PatchBatchOverview,1000);



/* ===== V45 创建批次弹窗优化逻辑 ===== */
if(typeof newBatchState === 'object'){
  newBatchState = Object.assign({owner:'', type:'自营', no:'', remark:'', carryGoods:false}, newBatchState || {});
}
function inferOwnerType(owner){
  const found = batches.find(b => b.owner === owner && (b.tag === '自营' || b.tag === '代卖'));
  if(found) return found.tag;
  return newBatchState.type === '代卖' ? '代卖' : '自营';
}
function ownerTypeBadgeClass(type){
  return type === '代卖' ? 'consignment' : 'self';
}
function padBatchNoV45(no){
  const s = String(no || '').trim();
  if(!s) return '';
  if(/^\d+$/.test(s)) return s.padStart(Math.max(3, s.length), '0');
  return s;
}
function focusBatchOwnerSearch(){
  const el = document.getElementById('batchOwnerSearchInput');
  if(el) el.focus();
}
function refreshBatchPreview(){
  const owner = newBatchState.owner || owners[0] || '';
  newBatchState.owner = owner;
  newBatchState.type = inferOwnerType(owner);
  const ownerName = document.getElementById('batchSelectedOwnerName');
  const ownerType = document.getElementById('batchSelectedOwnerType');
  if(ownerName) ownerName.textContent = owner || '请选择货主';
  if(ownerType) ownerType.textContent = owner ? `当前类型：${newBatchState.type}` : '请选择右侧货主';
  const input = document.getElementById('batchNoInput');
  const nextNo = padBatchNoV45(nextBatchNoForOwner(owner));
  if(input && (!input.value || input.dataset.autoFill === '1')){
    input.value = nextNo;
    input.dataset.autoFill = '1';
  }
  const remark = document.getElementById('batchRemarkInput');
  if(remark) remark.value = newBatchState.remark || '';
  const carry = document.getElementById('batchCarryGoodsInput');
  if(carry) carry.checked = !!newBatchState.carryGoods;
  renderOwnerListForBatchModal();
}
function selectOwnerInBatchModal(owner){
  newBatchState.owner = owner;
  newBatchState.type = inferOwnerType(owner);
  const input = document.getElementById('batchNoInput');
  if(input){
    input.value = padBatchNoV45(nextBatchNoForOwner(owner));
    input.dataset.autoFill = '1';
  }
  refreshBatchPreview();
}
function renderOwnerListForBatchModal(){
  const wrap = document.getElementById('batchOwnerListV45');
  if(!wrap) return;
  const keyword = (document.getElementById('batchOwnerSearchInput')?.value || '').trim().toLowerCase();
  const list = owners.filter(o => !keyword || String(o).toLowerCase().includes(keyword));
  if(!list.length){
    wrap.innerHTML = '<div class="batch-owner-tip-v45">没有找到匹配的货主</div>';
    return;
  }
  wrap.innerHTML = list.map(owner=>{
    const type = inferOwnerType(owner);
    const active = owner === newBatchState.owner ? ' active' : '';
    const badgeClass = ownerTypeBadgeClass(type);
    return `
      <div class="batch-owner-item-v45${active}" onclick="selectOwnerInBatchModal('${esc(owner)}')">
        <div class="batch-owner-item-left-v45">
          <span class="batch-owner-edit-v45">✎</span>
          <span class="batch-owner-name-v45">${esc(owner)}</span>
          <span class="batch-owner-badge-v45 ${badgeClass}">${type}</span>
        </div>
      </div>`;
  }).join('');
}
function openBatchModal(){
  const defaultOwner = activeBatch() ? activeBatch().owner : (owners[0] || '');
  newBatchState.owner = defaultOwner;
  newBatchState.type = inferOwnerType(defaultOwner);
  newBatchState.remark = '';
  newBatchState.carryGoods = false;
  document.getElementById('batchModal').classList.add('show');
  const search = document.getElementById('batchOwnerSearchInput');
  if(search) search.value = '';
  const input = document.getElementById('batchNoInput');
  if(input){
    input.value = padBatchNoV45(nextBatchNoForOwner(defaultOwner));
    input.dataset.autoFill = '1';
    input.oninput = ()=>{ input.dataset.autoFill = '0'; };
  }
  const remark = document.getElementById('batchRemarkInput');
  if(remark){
    remark.value = '';
    remark.oninput = ()=>{ newBatchState.remark = remark.value.trim(); };
  }
  const carry = document.getElementById('batchCarryGoodsInput');
  if(carry){
    carry.checked = false;
    carry.onchange = ()=>{ newBatchState.carryGoods = carry.checked; };
  }
  refreshBatchPreview();
}
function closeBatchModal(){
  document.getElementById('batchModal').classList.remove('show');
}
function addOwnerFromBatchModal(){
  showBatchOwnerAddInlineStep1();
}
function saveBatchFromModal(){
  const owner = (newBatchState.owner || '').trim();
  if(!owner){ alert('请先选择货主'); return; }
  const noInput = document.getElementById('batchNoInput');
  const no = (noInput?.value || '').trim() || padBatchNoV45(nextBatchNoForOwner(owner));
  const remark = (document.getElementById('batchRemarkInput')?.value || '').trim();
  const carryGoods = !!document.getElementById('batchCarryGoodsInput')?.checked;
  const type = inferOwnerType(owner);
  const id = 'b' + Date.now();
  let copiedItems = [];
  if(carryGoods){
    const latest = batches.find(b => b.owner === owner && b.items && b.items.length);
    if(latest){
      copiedItems = JSON.parse(JSON.stringify(latest.items));
    }
  }
  batches.unshift({id, owner, no, tag:type, fee:0, remark, items:copiedItems});
  activeBatchId = id;
  closeBatchModal();
  renderAll();
  toast(`${owner} 的新批次 ${no} 已创建`);
}


/* ===== V47：买家管理 + 订单查询 + 分享账单 + 赊欠还款逻辑 ===== */
let selectedBuyerV47Id = "c1";

function ensureBuyerV47TempCustomer(){
  if(!Array.isArray(cashierCustomers)) return;
  let temp = cashierCustomers.find(c => c.id === "c1" || c.name === "临时客户");
  if(!temp){
    cashierCustomers.unshift({id:"c1", name:"临时客户", debt:0, payments:[]});
  }else{
    temp.id = "c1";
    temp.name = "临时客户";
    temp.debt = Number(temp.debt || 0);
    if(!Array.isArray(temp.payments)) temp.payments = [];
  }
  cashierCustomers.forEach(c=>{
    if(!Array.isArray(c.payments)) c.payments = [];
    c.debt = Number(c.debt || 0);
  });
}

function buyerV47IdOfOrder(o){
  return o.customerId || "";
}

function buyerV47OrdersFor(id){
  const buyer = (cashierCustomers || []).find(c=>c.id === id);
  if(!buyer) return [];
  const sourceOrders = typeof window.cangjieFilterOrdersForCurrentAccountV94 === "function" ? window.cangjieFilterOrdersForCurrentAccountV94(finalOrders || []) : (finalOrders || []);
  return sourceOrders.filter(o => o.customerId === buyer.id || o.customerName === buyer.name)
    .sort((a,b)=>String(b.time || "").localeCompare(String(a.time || "")));
}

function buyerV47PaymentsFor(id){
  const buyer = (cashierCustomers || []).find(c=>c.id === id);
  if(!buyer) return [];
  const canViewAll = typeof window.cangjieCanViewAllOrdersV94 === "function" ? window.cangjieCanViewAllOrdersV94() : true;
  const p1 = canViewAll && Array.isArray(buyer.payments) ? buyer.payments : [];
  const p2 = [];
  const sourceOrders = typeof window.cangjieFilterOrdersForCurrentAccountV94 === "function" ? window.cangjieFilterOrdersForCurrentAccountV94(finalOrders || []) : (finalOrders || []);
  sourceOrders.forEach(o=>{
    if(o.customerId === buyer.id || o.customerName === buyer.name){
      (o.payments || []).forEach(p=>p2.push({...p, orderNo:o.orderNo || o.billNo || ""}));
    }
  });
  return [...p1, ...p2].sort((a,b)=>String(b.time || "").localeCompare(String(a.time || "")));
}

function buyerV47GoodsText(order){
  return (order.lines || []).map(i => {
    const qty = i.qty ? i.qty + (i.unit || "件") : "";
    const w = i.weight ? i.weight + "斤" : "";
    return [i.name || i.goodsName || "", qty, w].filter(Boolean).join(" ");
  }).filter(Boolean).join("，") || "—";
}

function buyerV47PaidAmount(order){
  const status = String(order.displayStatus || order.status || "");
  if(status.includes("收银")) return Number(order.totalAmount || 0);
  return Number(order.paid || 0) + (order.payments || []).reduce((s,p)=>s+Number(p.amount || 0),0);
}

function buyerV47DebtAmount(order){
  const status = String(order.displayStatus || order.status || "");
  if(status.includes("收银")) return 0;
  const direct = Number(order.debt || 0);
  if(direct > 0) return Math.max(0, direct);
  if(status.includes("赊欠")){
    return Math.max(0, Number(order.totalAmount || 0) - buyerV47PaidAmount(order));
  }
  return 0;
}

function recalcBuyerV47Debt(id){
  const buyer = (cashierCustomers || []).find(c=>c.id === id);
  if(!buyer) return 0;
  const debt = buyerV47OrdersFor(id).reduce((s,o)=>s+buyerV47DebtAmount(o),0);
  buyer.debt = Number(debt || 0);
  return buyer.debt;
}

function buyerV47OrderStatus(order){
  const debt = buyerV47DebtAmount(order);
  const paid = buyerV47PaidAmount(order);
  const total = Number(order.totalAmount || 0);
  const st = String(order.displayStatus || order.status || "");
  if(debt <= 0 && paid >= total && total > 0) return "已结清";
  if(debt > 0 && paid > 0) return "部分还款";
  if(debt > 0 || st.includes("赊欠")) return "赊欠";
  return st || "订单";
}

function buyerV47StatusClass(order){
  const s = buyerV47OrderStatus(order);
  if(s === "已结清") return "cash";
  if(s === "部分还款") return "part";
  if(s === "赊欠") return "debt";
  return "other";
}

function openBuyerManagerV47(){
  ensureBuyerV47TempCustomer();
  const mask = document.getElementById("buyerManagerV47");
  if(mask) mask.classList.add("show");
  renderBuyerV47();
}

function closeBuyerManagerV47(){
  const mask = document.getElementById("buyerManagerV47");
  if(mask) mask.classList.remove("show");
}

function renderBuyerV47List(){
  ensureBuyerV47TempCustomer();
  const box = document.getElementById("buyerV47List");
  if(!box) return;
  const q = (document.getElementById("buyerV47Search")?.value || "").trim().toLowerCase();
  const rows = (cashierCustomers || []).filter(c => !q || String(c.name || "").toLowerCase().includes(q));
  box.innerHTML = rows.map(c=>{
    recalcBuyerV47Debt(c.id);
    const orders = buyerV47OrdersFor(c.id);
    const active = c.id === selectedBuyerV47Id ? " active" : "";
    const type = c.id === "c1" || c.name === "临时客户" ? "临时客户" : "正式买家";
    return `
      <div class="buyer-v47-card${active}" onclick="selectBuyerV47('${esc(c.id)}')">
        <b>${esc(c.name)}</b>
        <span>欠款：${money(c.debt || 0)}｜订单：${orders.length} 单</span>
        <span class="buyer-v47-tag">${type}</span>
      </div>
    `;
  }).join("") || `<div class="buyer-v47-empty">没有找到买家</div>`;
}

function selectBuyerV47(id){
  ensureBuyerV47TempCustomer();
  selectedBuyerV47Id = id || "c1";
  renderBuyerV47List();
  renderBuyerV47Detail();
}

function renderBuyerV47Detail(){
  ensureBuyerV47TempCustomer();
  const buyer = (cashierCustomers || []).find(c=>c.id === selectedBuyerV47Id) || (cashierCustomers || [])[0];
  if(!buyer) return;
  recalcBuyerV47Debt(buyer.id);

  const orders = buyerV47OrdersFor(buyer.id);
  const payments = buyerV47PaymentsFor(buyer.id);
  const last = orders[0];
  const isTemp = buyer.id === "c1" || buyer.name === "临时客户";

  const setText = (id,val)=>{ const el=document.getElementById(id); if(el) el.textContent = val; };
  setText("buyerV47Name", buyer.name);
  setText("buyerV47Sub", isTemp ? "临时客户｜只能收银，不能赊欠" : "正式买家｜可收银，可赊欠，可还款");
  setText("buyerV47Type", isTemp ? "临时" : "正式");
  setText("buyerV47Debt", money(buyer.debt || 0));
  setText("buyerV47OrderCount", String(orders.length));
  setText("buyerV47PaymentCount", String(payments.length));
  setText("buyerV47LastOrder", last ? (last.time || "有订单") : "暂无");

  const rowsEl = document.getElementById("buyerV47OrderRows");
  if(rowsEl){
    if(!orders.length){
      rowsEl.innerHTML = `<tr><td colspan="8"><div class="buyer-v47-empty">该买家暂无订单</div></td></tr>`;
    }else{
      rowsEl.innerHTML = orders.map(o=>{
        const no = o.orderNo || o.billNo || "";
        const debt = buyerV47DebtAmount(o);
        return `
          <tr>
            <td>${esc(o.time || "")}</td>
            <td>${esc(no)}</td>
            <td><span class="buyer-v47-status ${buyerV47StatusClass(o)}">${esc(buyerV47OrderStatus(o))}</span></td>
            <td>${esc(buyerV47GoodsText(o))}</td>
            <td>${money(o.totalAmount || 0)}</td>
            <td>${money(buyerV47PaidAmount(o))}</td>
            <td>${money(debt)}</td>
            <td>
              <button class="buyer-v47-mini-btn blue" onclick="copyBuyerV47OneOrderBill('${esc(no)}')">账单</button>
              ${debt > 0 ? `<button class="buyer-v47-mini-btn orange" onclick="openBuyerV47Payment('${esc(no)}')">还款</button>` : `<button class="buyer-v47-mini-btn gray" disabled>已结清</button>`}
            </td>
          </tr>
        `;
      }).join("");
    }
  }

  const payRows = document.getElementById("buyerV47PaymentRows");
  if(payRows){
    if(!payments.length){
      payRows.innerHTML = `<tr><td colspan="5"><div class="buyer-v47-empty">暂无还款记录</div></td></tr>`;
    }else{
      payRows.innerHTML = payments.map(p=>`
        <tr>
          <td>${esc(p.time || "")}</td>
          <td>${esc(p.orderNo || "总账还款")}</td>
          <td>${money(p.amount || 0)}</td>
          <td>${esc(p.method || "")}</td>
          <td>${esc(p.remark || "")}</td>
        </tr>
      `).join("");
    }
  }

  const bill = document.getElementById("buyerV47BillText");
  if(bill) bill.value = makeBuyerV47BillText(buyer.id);
}

function renderBuyerV47(){
  ensureBuyerV47TempCustomer();
  renderBuyerV47List();
  renderBuyerV47Detail();
}

function addBuyerV47(){
  ensureBuyerV47TempCustomer();
  const name = prompt("请输入买家名称：");
  if(!name) return;
  const clean = name.trim();
  if(!clean) return;
  const existed = (cashierCustomers || []).find(c=>c.name === clean);
  if(existed){
    selectedBuyerV47Id = existed.id;
    renderBuyerV47();
    toast("买家已存在，已为你选中");
    return;
  }
  const c = {id:"c" + Date.now(), name:clean, debt:0, payments:[]};
  cashierCustomers.push(c);
  selectedBuyerV47Id = c.id;
  if(typeof renderCashierCustomers === "function") renderCashierCustomers();
  renderBuyerV47();
  toast("买家已新增");
}

function useBuyerV47ForCashier(){
  ensureBuyerV47TempCustomer();
  const buyer = (cashierCustomers || []).find(c=>c.id === selectedBuyerV47Id) || (cashierCustomers || [])[0];
  if(!buyer) return;
  if(typeof renderCashierCustomers === "function") renderCashierCustomers();
  const sel = document.getElementById("cashierCustomer");
  if(sel) sel.value = buyer.id;
  try{ window.selectedCashierCustomerIdV116 = buyer.id; }catch(err){}
  try{ if(typeof window.syncCustomerStateV116 === "function") window.syncCustomerStateV116(buyer.id); }catch(err){}
  try{ window.currentBuyer = buyer; window.selectedBuyer = buyer; }catch(err){}
  try{ if(typeof handleCustomerOrPayChange === "function") handleCustomerOrPayChange(); }catch(err){}
  closeBuyerManagerV47();
  if(typeof showAppPage === "function") showAppPage("cashier");
  toast("已设为当前收银买家：" + buyer.name);
}

function makeBuyerV47ShareLink(id){
  const buyer = (cashierCustomers || []).find(c=>c.id === id);
  const name = buyer ? buyer.name : "buyer";
  return "https://tudou2.local/bill?buyer=" + encodeURIComponent(name) + "&id=" + encodeURIComponent(id || "");
}

function makeBuyerV47BillText(id){
  ensureBuyerV47TempCustomer();
  const buyer = (cashierCustomers || []).find(c=>c.id === id);
  if(!buyer) return "";
  recalcBuyerV47Debt(buyer.id);
  const orders = buyerV47OrdersFor(buyer.id);
  const debtOrders = orders.filter(o=>buyerV47DebtAmount(o)>0);
  const payments = buyerV47PaymentsFor(buyer.id);
  const totalOrdersAmount = orders.reduce((s,o)=>s+Number(o.totalAmount || 0),0);
  const totalPaid = orders.reduce((s,o)=>s+buyerV47PaidAmount(o),0);
  const debt = Number(buyer.debt || 0);
  const lines = [];
  lines.push("仓頡买家账单");
  lines.push("买家：" + buyer.name);
  lines.push("生成时间：" + new Date().toLocaleString("zh-CN",{hour12:false}));  lines.push("------------------------");
  lines.push("全部订单：" + orders.length + " 单");
  lines.push("订单总额：" + money(totalOrdersAmount));
  lines.push("已收/已还：" + money(totalPaid));
  lines.push("当前欠款：" + money(debt));
  lines.push("------------------------");
  lines.push("未结清赊欠订单：");
  if(!debtOrders.length){
    lines.push("无未结清赊欠订单");
  }else{
    debtOrders.forEach((o,idx)=>{
      lines.push((idx+1) + ". " + (o.orderNo || o.billNo || "") + "｜" + (o.time || "") + "｜" + buyerV47GoodsText(o) + "｜订单" + money(o.totalAmount || 0) + "｜已还" + money(buyerV47PaidAmount(o)) + "｜欠" + money(buyerV47DebtAmount(o)));
    });
  }
  lines.push("------------------------");
  lines.push("还款记录：");
  if(!payments.length){
    lines.push("暂无还款记录");
  }else{
    payments.forEach((p,idx)=>{
      lines.push((idx+1) + ". " + (p.time || "") + "｜" + (p.orderNo || "总账还款") + "｜" + money(p.amount || 0) + "｜" + (p.method || "") + (p.remark ? "｜" + p.remark : ""));
    });
  }
  return lines.join("\n");
}

function copyBuyerV47Text(text, ok){
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(()=>toast(ok || "已复制"));
  }else{
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    toast(ok || "已复制");
  }
}

function copyBuyerV47BillText(){
  const buyer = (cashierCustomers || []).find(c=>c.id === selectedBuyerV47Id);
  if(!buyer) return;
  copyBuyerV47Text(makeBuyerV47BillText(buyer.id), "账单文字已复制，可粘贴到微信发送");
}

function copyBuyerV47ShareLink(){
  const buyer = (cashierCustomers || []).find(c=>c.id === selectedBuyerV47Id);
  if(!buyer) return;
  copyBuyerV47Text(makeBuyerV47ShareLink(buyer.id), "账单链接已复制");
}

function copyBuyerV47OneOrderBill(orderNo){
  const order = (finalOrders || []).find(o=>(o.orderNo || o.billNo || "") === orderNo);
  if(!order) return;
  const text = [
    "仓頡订单账单",
    "订单号：" + orderNo,
    "客户：" + (order.customerName || ""),
    "时间：" + (order.time || ""),
    "商品：" + buyerV47GoodsText(order),
    "订单金额：" + money(order.totalAmount || 0),
    "已收/已还：" + money(buyerV47PaidAmount(order)),
    "剩余欠款：" + money(buyerV47DebtAmount(order))
  ].join("\n");
  copyBuyerV47Text(text, "该订单账单已复制");
}

function printBuyerV47Bill(){
  const buyer = (cashierCustomers || []).find(c=>c.id === selectedBuyerV47Id);
  if(!buyer) return;
  const w = window.open("", "_blank");
  const content = makeBuyerV47BillText(buyer.id).replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
  w.document.write(`<html><head><title>买家账单</title></head><body>${content}</body></html>`);
  w.document.close();
  w.print();
}

/* extracted script block 4 */
(function(){
  function hydrateCustomersFromStorageV116(){
    var keys = ['CANGJIE_APP_STATE_V1', 'tudou2_v57_persistent_data'];
    var target = Array.isArray(window.cashierCustomers) ? window.cashierCustomers : [];
    if(!Array.isArray(window.cashierCustomers)) window.cashierCustomers = target;
    var seen = {};
    target.forEach(function(c){
      if(!c) return;
      var key = String(c.id || c.name || '');
      if(key) seen[key] = true;
    });
    keys.forEach(function(keyName){
      try{
        var raw = localStorage.getItem(keyName);
        if(!raw) return;
        var data = JSON.parse(raw);
        ['cashierCustomers','customers','buyerV47List','buyers'].forEach(function(field){
          var rows = Array.isArray(data && data[field]) ? data[field] : [];
          rows.forEach(function(item){
            if(!item) return;
            var id = String(item.id || item.customerId || '');
            var name = String(item.name || item.customerName || '').trim();
            if(!id && !name) return;
            var dedupe = id || ('name:' + name);
            if(seen[dedupe]) return;
            seen[dedupe] = true;
            target.push({
              id: id || ('c' + Date.now() + Math.floor(Math.random()*1000)),
              name: name || '买家',
              debt: Number(item.debt || 0),
              payments: Array.isArray(item.payments) ? item.payments : [],
              parentId: item.parentId || '',
              disabled: !!item.disabled
            });
          });
        });
      }catch(err){}
    });
    var temp = target.find(function(c){ return c && (c.id === 'c1' || String(c.name || '').startsWith('临时客户')); });
    if(!temp){
      target.unshift({ id:'c1', name:'临时客户', debt:0, payments:[], parentId:'', disabled:false });
    }else{
      temp.id = 'c1';
      temp.name = '临时客户';
    }
  }
  function tempCustomerV116(){
    hydrateCustomersFromStorageV116();
    var list = Array.isArray(window.cashierCustomers) ? window.cashierCustomers : [];
    return list.find(function(c){ return c && (c.id === 'c1' || String(c.name || '').startsWith('临时客户')); }) || { id:'c1', name:'临时客户' };
  }
  function activeSessionV116(){
    try{
      var sessions = Array.isArray(window.cashierBillSessionsStep1) ? window.cashierBillSessionsStep1 : [];
      var activeBtn = document.querySelector('#cashierRoot .order-tab.active[data-bill-session]');
      var id = activeBtn ? activeBtn.getAttribute('data-bill-session') : '';
      return sessions.find(function(s){ return s && s.id === id; }) || sessions[0] || null;
    }catch(err){
      return null;
    }
  }
  function sessionClearedV116(session){
    return !!(session && (session.__cartClearedV116 || session.__completedV116 || session.__cartSavedV116));
  }
  function listCustomersV116(){
    hydrateCustomersFromStorageV116();
    return Array.isArray(window.cashierCustomers) ? window.cashierCustomers : [];
  }
  function customerByIdV116(id){
    return listCustomersV116().find(function(c){ return c && c.id === id; }) || null;
  }
  function selectedCustomerIdV116(){
    var sel = document.getElementById('cashierCustomer');
    var session = activeSessionV116();
    var selId = String((sel && sel.value) || '');
    var sessionId = String((session && session.customerId) || '');
    var rememberedId = String(window.selectedCashierCustomerIdV116 || '');
    if(rememberedId && rememberedId !== 'c1' && (!selId || selId === 'c1') && (!sessionId || sessionId === 'c1')){
      return rememberedId;
    }
    return String(
      selId
      || sessionId
      || rememberedId
      || (tempCustomerV116().id || 'c1')
    );
  }
  window.syncCustomerStateV116 = syncCustomerStateV116;
  function syncCustomerStateV116(id){
    var nextId = String(id || selectedCustomerIdV116() || 'c1');
    var buyer = customerByIdV116(nextId) || tempCustomerV116();
    window.selectedCashierCustomerIdV116 = buyer.id || nextId || 'c1';
    try{ window.currentBuyer = buyer; window.selectedBuyer = buyer; }catch(err){}
    var session = activeSessionV116();
    if(session){
      session.customerId = window.selectedCashierCustomerIdV116;
      if(buyer && buyer.name) session.name = buyer.name;
    }
    var sel = document.getElementById('cashierCustomer');
    if(sel){
      var hasOption = Array.from(sel.options || []).some(function(opt){ return opt.value === window.selectedCashierCustomerIdV116; });
      if(hasOption) sel.value = window.selectedCashierCustomerIdV116;
    }
    try{ if(typeof window.renderCashierBuyerTreeV82 === 'function') window.renderCashierBuyerTreeV82(); }catch(err){}
    try{
      var mask = document.getElementById('checkoutConfirmMaskV107');
      if(mask && mask.classList.contains('show') && typeof window.renderModalV107 === 'function') window.renderModalV107();
    }catch(err){}
    return buyer;
  }
  function currentCartV116(){
    try{ if(Array.isArray(currentCodeBillItems) && currentCodeBillItems.length) return currentCodeBillItems; }catch(err){}
    var cartCleared = false;
    try{ cartCleared = !!window.__cashierCartClearedV116; }catch(err){}
    var session = activeSessionV116();
    var stepSession = null;
    try{ stepSession = typeof activeSession === 'function' ? activeSession() : null; }catch(err){}
    var sessionStatus = String((session && session.status) || '');
    var stepStatus = String((stepSession && stepSession.status) || '');
    var restoring = !!(
      (session && (session.__restoringFromBillV116 || session.__takenFromBillV116 || sessionStatus === 'restoringFromBill' || sessionStatus === 'taken'))
      || (stepSession && (stepSession.__restoringFromBillV116 || stepSession.__takenFromBillV116 || stepStatus === 'restoringFromBill' || stepStatus === 'taken'))
    );
    var hardCleared = !!(
      cartCleared
      || (session && (sessionStatus === 'clearedAfterSave' || sessionStatus === 'clearedAfterSubmit' || sessionStatus === 'completed' || sessionStatus === 'cleared'))
      || (stepSession && (stepStatus === 'clearedAfterSave' || stepStatus === 'clearedAfterSubmit' || stepStatus === 'completed' || stepStatus === 'cleared'))
      || sessionClearedV116(session)
      || sessionClearedV116(stepSession)
    );
    var selectedSavedBill = false;
    try{
      selectedSavedBill = !!(
        selectedBillCenterId
        && Array.isArray(savedCodeBills)
        && savedCodeBills.some(function(b){ return b && b.billNo === selectedBillCenterId; })
      );
    }catch(err){}
    var baseCartEmpty = true;
    try{ baseCartEmpty = !Array.isArray(currentCodeBillItems) || !currentCodeBillItems.length; }catch(err){}
    var stepSessionEmpty = !stepSession || !Array.isArray(stepSession.items) || !stepSession.items.length;
    var inferredSavedClear = !!(!restoring && baseCartEmpty && selectedSavedBill && stepSessionEmpty);
    var blockRestore = hardCleared || inferredSavedClear;
    if(hardCleared && !restoring) return [];
    if(inferredSavedClear) return [];
    if(!blockRestore && session && Array.isArray(session.items) && session.items.length) return session.items;
    if(!blockRestore && Array.isArray(window.currentCodeBillItems) && window.currentCodeBillItems.length) return window.currentCodeBillItems;
    if(!blockRestore && Array.isArray(window.checkoutCartSnapshotV115) && window.checkoutCartSnapshotV115.length) return window.checkoutCartSnapshotV115;
    return [];
  }
  function cloneRowsV116(rows){
    return (Array.isArray(rows) ? rows : []).map(function(item){ return Object.assign({}, item); });
  }
  function syncCartStateV116(rows){
    var session = activeSessionV116();
    var stepSession = null;
    try{ stepSession = typeof activeSession === 'function' ? activeSession() : null; }catch(err){}
    var sessionStatus = String((session && session.status) || '');
    var stepStatus = String((stepSession && stepSession.status) || '');
    var restoring = !!(
      (session && (session.__restoringFromBillV116 || session.__takenFromBillV116 || sessionStatus === 'restoringFromBill' || sessionStatus === 'taken'))
      || (stepSession && (stepSession.__restoringFromBillV116 || stepSession.__takenFromBillV116 || stepStatus === 'restoringFromBill' || stepStatus === 'taken'))
    );
    var hardCleared = !!(
      (session && (sessionStatus === 'clearedAfterSave' || sessionStatus === 'clearedAfterSubmit' || sessionStatus === 'completed' || sessionStatus === 'cleared'))
      || (stepSession && (stepStatus === 'clearedAfterSave' || stepStatus === 'clearedAfterSubmit' || stepStatus === 'completed' || stepStatus === 'cleared'))
      || sessionClearedV116(session)
      || sessionClearedV116(stepSession)
    );
    var selectedSavedBill = false;
    try{
      selectedSavedBill = !!(
        selectedBillCenterId
        && Array.isArray(savedCodeBills)
        && savedCodeBills.some(function(b){ return b && b.billNo === selectedBillCenterId; })
      );
    }catch(err){}
    var live = Array.isArray(rows) ? rows : currentCartV116();
    if(!Array.isArray(live)) live = [];
    var stepSessionEmpty = !stepSession || !Array.isArray(stepSession.items) || !stepSession.items.length;
    var inferredSavedClear = !!(!restoring && !live.length && selectedSavedBill && stepSessionEmpty);
    if(live.length){
      hardCleared = false;
      inferredSavedClear = false;
    }
    if((hardCleared || inferredSavedClear) && !restoring){
      live = [];
    }
    try{
      if(live.length) window.__cashierCartClearedV116 = false;
      else{
        window.__cashierCartClearedV116 = true;
        if(!Array.isArray(rows)) live = [];
      }
    }catch(err){}
    try{ currentCodeBillItems = live; }catch(err){}
    try{ window.currentCodeBillItems = live; }catch(err){}
    try{ if(!live.length) window.checkoutCartSnapshotV115 = []; }catch(err){}
    if(session){
      session.items = live;
      if(live.length){
        try{
          delete session.__cartClearedV116;
          delete session.__completedV116;
          delete session.__cartSavedV116;
        }catch(err){}
      }else{
        session.__cartClearedV116 = true;
      }
    }
    if(stepSession && stepSession !== session){
      stepSession.items = live;
      if(live.length){
        try{
          delete stepSession.__cartClearedV116;
          delete stepSession.__completedV116;
          delete stepSession.__cartSavedV116;
        }catch(err){}
      }else{
        stepSession.__cartClearedV116 = true;
      }
    }
    return live;
  }
  function restoreCartStateV116(){
    var rows = currentCartV116();
    if(!rows.length) return [];
    var live = cloneRowsV116(rows);
    return syncCartStateV116(live);
  }

  hydrateCustomersFromStorageV116();
  try{ if(!window.selectedCashierCustomerIdV116) window.selectedCashierCustomerIdV116 = localStorage.getItem('CANGJIE_SELECTED_CUSTOMER_V116') || ''; }catch(err){}
  syncCustomerStateV116();
  syncCartStateV116(Array.isArray(window.currentCodeBillItems) ? window.currentCodeBillItems : []);

  var oldRenderCustomersV116 = typeof window.renderCashierCustomers === 'function' ? window.renderCashierCustomers : null;
  if(oldRenderCustomersV116 && !oldRenderCustomersV116.__stateFixV116Wrapped){
    window.renderCashierCustomers = function(){
      hydrateCustomersFromStorageV116();
      var selBefore = document.getElementById('cashierCustomer');
      var keepId = window.selectedCashierCustomerIdV116 || (selBefore && selBefore.value) || selectedCustomerIdV116();
      var result = oldRenderCustomersV116.apply(this, arguments);
      syncCustomerDisplayAfterRenderV120(keepId);
      return result;
    };
    window.renderCashierCustomers.__stateFixV116Wrapped = true;
  }

  var oldHandleCustomerV116 = typeof window.handleCustomerOrPayChange === 'function' ? window.handleCustomerOrPayChange : null;
  if(oldHandleCustomerV116 && !oldHandleCustomerV116.__stateFixV116Wrapped){
    window.handleCustomerOrPayChange = function(){
      var sel = document.getElementById('cashierCustomer');
      if(sel && sel.value) window.selectedCashierCustomerIdV116 = sel.value;
      try{ localStorage.setItem('CANGJIE_SELECTED_CUSTOMER_V116', window.selectedCashierCustomerIdV116 || 'c1'); }catch(err){}
      var result = oldHandleCustomerV116.apply(this, arguments);
      syncCustomerStateV116();
      syncCartStateV116();
      return result;
    };
    window.handleCustomerOrPayChange.__stateFixV116Wrapped = true;
  }

  var oldRenderAllV116 = typeof window.renderCashierAll === 'function' ? window.renderCashierAll : null;
  if(oldRenderAllV116 && !oldRenderAllV116.__stateFixV116Wrapped){
    window.renderCashierAll = function(){
      var selBefore = document.getElementById('cashierCustomer');
      var keepId = window.selectedCashierCustomerIdV116 || (selBefore && selBefore.value) || selectedCustomerIdV116();
      var result = oldRenderAllV116.apply(this, arguments);
      syncCartStateV116();
      syncCustomerStateV116(keepId);
      return result;
    };
    window.renderCashierAll.__stateFixV116Wrapped = true;
  }

  var oldRenderBillV116 = typeof window.renderCurrentCodeBill === 'function' ? window.renderCurrentCodeBill : null;
  if(oldRenderBillV116 && !oldRenderBillV116.__stateFixV116Wrapped){
    window.renderCurrentCodeBill = function(){
      syncCartStateV116();
      var result = oldRenderBillV116.apply(this, arguments);
      syncCartStateV116();
      return result;
    };
    window.renderCurrentCodeBill.__stateFixV116Wrapped = true;
  }

  ['addProductToCodeBill','removeCodeBillItem','updateCodeBillItem'].forEach(function(name){
    var oldFn = window[name];
    if(typeof oldFn !== 'function' || oldFn.__stateFixV116Wrapped) return;
    window[name] = function(){
      var result = oldFn.apply(this, arguments);
      syncCartStateV116();
      return result;
    };
    window[name].__stateFixV116Wrapped = true;
  });

  ['selectCashierBuyerTreeV82','pickCashierBuyerDirectV82'].forEach(function(name){
    var oldFn = window[name];
    if(typeof oldFn !== 'function' || oldFn.__stateFixV116Wrapped) return;
    window[name] = function(){
      var result = oldFn.apply(this, arguments);
      var sel = document.getElementById('cashierCustomer');
      syncCustomerStateV116(sel && sel.value);
      if(typeof window.handleCustomerOrPayChange === 'function') window.handleCustomerOrPayChange();
      return result;
    };
    window[name].__stateFixV116Wrapped = true;
  });

  var oldOpenCheckoutV116 = typeof window.openCheckoutConfirmModalV107 === 'function' ? window.openCheckoutConfirmModalV107 : null;
  if(oldOpenCheckoutV116 && !oldOpenCheckoutV116.__stateFixV116Wrapped){
    window.openCheckoutConfirmModalV107 = function(){
      restoreCartStateV116();
      syncCustomerStateV116();
      return oldOpenCheckoutV116.apply(this, arguments);
    };
    window.openCheckoutConfirmModalV107.__stateFixV116Wrapped = true;
  }

  var oldBuildBillV116 = typeof window.buildCodeBill === 'function' ? window.buildCodeBill : null;
  if(oldBuildBillV116 && !oldBuildBillV116.__stateFixV116Wrapped){
    window.buildCodeBill = function(){
      restoreCartStateV116();
      syncCustomerStateV116();
      var bill = oldBuildBillV116.apply(this, arguments);
      var buyer = syncCustomerStateV116();
      if(bill && buyer){
        bill.customerId = buyer.id || bill.customerId || 'c1';
        bill.customerName = buyer.name || bill.customerName || '临时客户';
      }
      return bill;
    };
    window.buildCodeBill.__stateFixV116Wrapped = true;
  }

  var oldCashSubmitV116 = typeof window.submitCheckoutConfirmModalV107 === 'function' ? window.submitCheckoutConfirmModalV107 : null;
  if(oldCashSubmitV116 && !oldCashSubmitV116.__stateFixV116Wrapped){
    window.submitCheckoutConfirmModalV107 = function(){
      restoreCartStateV116();
      syncCustomerStateV116();
      if(!currentCartV116().length){
        alert('请先选择商品。');
        return;
      }
      return oldCashSubmitV116.apply(this, arguments);
    };
    window.submitCheckoutConfirmModalV107.__stateFixV116Wrapped = true;
  }

  var oldDebtSubmitV116 = typeof window.submitDebtCheckoutConfirmModalV107 === 'function' ? window.submitDebtCheckoutConfirmModalV107 : null;
  if(oldDebtSubmitV116 && !oldDebtSubmitV116.__stateFixV116Wrapped){
    window.submitDebtCheckoutConfirmModalV107 = function(){
      restoreCartStateV116();
      syncCustomerStateV116();
      if(!currentCartV116().length){
        alert('请先选择商品。');
        return;
      }
      return oldDebtSubmitV116.apply(this, arguments);
    };
    window.submitDebtCheckoutConfirmModalV107.__stateFixV116Wrapped = true;
  }
})();

/* extracted script block 5 */
(function(){
  function listV117(){
    return Array.isArray(window.cashierCustomers) ? window.cashierCustomers : [];
  }
  function tempV117(){
    return listV117().find(function(c){ return c && (c.id === 'c1' || String(c.name || '').startsWith('临时客户')); }) || {id:'c1', name:'临时客户'};
  }
  function byIdV117(id){
    return listV117().find(function(c){ return c && c.id === id; }) || null;
  }
  function selectedIdV117(){
    var sel = document.getElementById('cashierCustomer');
    var sessions = Array.isArray(window.cashierBillSessionsStep1) ? window.cashierBillSessionsStep1 : [];
    var activeBtn = document.querySelector('#cashierRoot .order-tab.active[data-bill-session]');
    var sid = activeBtn ? activeBtn.getAttribute('data-bill-session') : '';
    var session = sessions.find(function(item){ return item && item.id === sid; }) || sessions[0];
    var selId = String((sel && sel.value) || '');
    var sessionId = String((session && session.customerId) || '');
    var rememberedId = String(window.selectedCashierCustomerIdV116 || '');
    if(rememberedId && rememberedId !== 'c1' && (!selId || selId === 'c1') && (!sessionId || sessionId === 'c1')){
      return rememberedId;
    }
    return String(selId || sessionId || rememberedId || 'c1');
  }
  function applyIdV117(id){
    var next = String(id || selectedIdV117() || 'c1');
    var buyer = byIdV117(next) || tempV117();
    window.selectedCashierCustomerIdV116 = buyer.id || 'c1';
    try{ window.currentBuyer = buyer; window.selectedBuyer = buyer; }catch(err){}
    try{ localStorage.setItem('CANGJIE_SELECTED_CUSTOMER_V116', window.selectedCashierCustomerIdV116); }catch(err){}
    var sel = document.getElementById('cashierCustomer');
    if(sel){
      var hasOption = Array.from(sel.options || []).some(function(opt){ return opt.value === window.selectedCashierCustomerIdV116; });
      if(hasOption) sel.value = window.selectedCashierCustomerIdV116;
    }
    try{
      var sessions = Array.isArray(window.cashierBillSessionsStep1) ? window.cashierBillSessionsStep1 : [];
      var activeBtn = document.querySelector('#cashierRoot .order-tab.active[data-bill-session]');
      var sid = activeBtn ? activeBtn.getAttribute('data-bill-session') : '';
      var s = sessions.find(function(item){ return item && item.id === sid; }) || sessions[0];
      if(s){
        s.customerId = window.selectedCashierCustomerIdV116;
        s.name = buyer.name || s.name || '临时客户';
      }
    }catch(err){}
    return buyer;
  }
  window.activeCashierCustomer = function(){
    var chosen = window.currentBuyer || window.selectedBuyer || null;
    if(chosen && chosen.id){
      return applyIdV117(chosen.id);
    }
    return applyIdV117();
  };
  var oldHandleV117 = typeof window.handleCustomerOrPayChange === 'function' ? window.handleCustomerOrPayChange : null;
  if(oldHandleV117 && !oldHandleV117.__stateGuardV117Wrapped){
    window.handleCustomerOrPayChange = function(){
      var sel = document.getElementById('cashierCustomer');
      if(sel && sel.value) applyIdV117(sel.value);
      var result = oldHandleV117.apply(this, arguments);
      applyIdV117(sel && sel.value);
      return result;
    };
    window.handleCustomerOrPayChange.__stateGuardV117Wrapped = true;
  }
  var oldRenderCustomersV117 = typeof window.renderCashierCustomers === 'function' ? window.renderCashierCustomers : null;
  if(oldRenderCustomersV117 && !oldRenderCustomersV117.__stateGuardV117Wrapped){
    window.renderCashierCustomers = function(){
      var keepId = selectedIdV117();
      var result = oldRenderCustomersV117.apply(this, arguments);
      syncCustomerDisplayAfterRenderV120(keepId);
      return result;
    };
    window.renderCashierCustomers.__stateGuardV117Wrapped = true;
  }
  var oldRenderAllV117 = typeof window.renderCashierAll === 'function' ? window.renderCashierAll : null;
  if(oldRenderAllV117 && !oldRenderAllV117.__stateGuardV117Wrapped){
    window.renderCashierAll = function(){
      var keepId = selectedIdV117();
      var result = oldRenderAllV117.apply(this, arguments);
      applyIdV117(keepId);
      return result;
    };
    window.renderCashierAll.__stateGuardV117Wrapped = true;
  }
  var oldSaveBuyerV117 = typeof window.saveCashierAddBuyerStep1 === 'function' ? window.saveCashierAddBuyerStep1 : null;
  if(oldSaveBuyerV117 && !oldSaveBuyerV117.__stateGuardV117Wrapped){
    window.saveCashierAddBuyerStep1 = function(){
      var input = document.getElementById('cashierAddBuyerNameStep1');
      var desiredName = String((input && input.value) || '').trim();
      var result = oldSaveBuyerV117.apply(this, arguments);
      if(desiredName){
        var buyer = listV117().find(function(c){ return c && c.name === desiredName; });
        if(buyer) applyIdV117(buyer.id);
      }
      return result;
    };
    window.saveCashierAddBuyerStep1.__stateGuardV117Wrapped = true;
  }
  try{ applyIdV117(localStorage.getItem('CANGJIE_SELECTED_CUSTOMER_V116') || selectedIdV117()); }catch(err){ applyIdV117(selectedIdV117()); }
})();

/* extracted script block 6 */
(function(){
  function activeCustomerV118(){
    try{ if(typeof window.activeCashierCustomer === 'function') return window.activeCashierCustomer() || {id:'c1', name:'临时客户'}; }catch(err){}
    return {id:'c1', name:'临时客户'};
  }
  function syncModalCustomerV118(){
    var customer = activeCustomerV118();
    var nameEl = document.getElementById('checkoutConfirmCustomerV107');
    var typeEl = document.getElementById('checkoutCustomerTypeV107');
    if(nameEl) nameEl.textContent = customer.name || '临时客户';
    if(typeEl) typeEl.textContent = customer.id === 'c1' || String(customer.name || '').startsWith('临时客户') ? '（临时客户）' : '（可赊欠客户）';
  }
  var oldOpenV118 = typeof window.openCheckoutConfirmModalV107 === 'function' ? window.openCheckoutConfirmModalV107 : null;
  if(oldOpenV118 && !oldOpenV118.__modalCustomerSyncV118Wrapped){
    window.openCheckoutConfirmModalV107 = function(){
      var result = oldOpenV118.apply(this, arguments);
      syncModalCustomerV118();
      return result;
    };
    window.openCheckoutConfirmModalV107.__modalCustomerSyncV118Wrapped = true;
  }
  var oldCashV118 = typeof window.submitCheckoutConfirmModalV107 === 'function' ? window.submitCheckoutConfirmModalV107 : null;
  if(oldCashV118 && !oldCashV118.__modalCustomerSyncV118Wrapped){
    window.submitCheckoutConfirmModalV107 = function(){
      syncModalCustomerV118();
      return oldCashV118.apply(this, arguments);
    };
    window.submitCheckoutConfirmModalV107.__modalCustomerSyncV118Wrapped = true;
  }
  var oldDebtV118 = typeof window.submitDebtCheckoutConfirmModalV107 === 'function' ? window.submitDebtCheckoutConfirmModalV107 : null;
  if(oldDebtV118 && !oldDebtV118.__modalCustomerSyncV118Wrapped){
    window.submitDebtCheckoutConfirmModalV107 = function(){
      syncModalCustomerV118();
      return oldDebtV118.apply(this, arguments);
    };
    window.submitDebtCheckoutConfirmModalV107.__modalCustomerSyncV118Wrapped = true;
  }
})();

/* extracted script block 7 */
function openBuyerV47Payment(orderNo){
  ensureBuyerV47TempCustomer();
  const buyer = (cashierCustomers || []).find(c=>c.id === selectedBuyerV47Id);
  if(!buyer) return;
  const select = document.getElementById("buyerV47PayOrder");
  const amount = document.getElementById("buyerV47PayAmount");
  const remark = document.getElementById("buyerV47PayRemark");
  const debtOrders = buyerV47OrdersFor(buyer.id).filter(o=>buyerV47DebtAmount(o)>0);
  if(!debtOrders.length){
    alert("该买家当前没有未结清欠款。");
    return;
  }
  if(select){
    select.innerHTML = debtOrders.map(o=>{
      const no = o.orderNo || o.billNo || "";
      return `<option value="${esc(no)}">${esc(no)}｜欠 ${money(buyerV47DebtAmount(o))}</option>`;
    }).join("");
    if(orderNo) select.value = orderNo;
  }
  const target = debtOrders.find(o=>(o.orderNo || o.billNo || "") === (orderNo || (select ? select.value : ""))) || debtOrders[0];
  if(amount) amount.value = target ? buyerV47DebtAmount(target).toFixed(2) : "";
  if(remark) remark.value = "";
  const mask = document.getElementById("buyerPaymentV47");
  if(mask) mask.classList.add("show");
}

function closeBuyerV47Payment(){
  const mask = document.getElementById("buyerPaymentV47");
  if(mask) mask.classList.remove("show");
}

function confirmBuyerV47Payment(){
  ensureBuyerV47TempCustomer();
  const buyer = (cashierCustomers || []).find(c=>c.id === selectedBuyerV47Id);
  if(!buyer) return;
  const orderNo = document.getElementById("buyerV47PayOrder")?.value || "";
  const amount = Number(document.getElementById("buyerV47PayAmount")?.value || 0);
  const method = document.getElementById("buyerV47PayMethod")?.value || "现金";
  const remark = document.getElementById("buyerV47PayRemark")?.value || "";
  if(amount <= 0){
    alert("请输入正确的还款金额。");
    return;
  }
  const order = (finalOrders || []).find(o=>(o.orderNo || o.billNo || "") === orderNo);
  if(!order){
    alert("没有找到对应订单。");
    return;
  }
  const debtBefore = buyerV47DebtAmount(order);
  if(amount > debtBefore){
    alert("还款金额不能大于该订单剩余欠款。");
    return;
  }
  const pay = {
    id:"pay_" + Date.now(),
    time:new Date().toLocaleString("zh-CN",{hour12:false}),
    amount,
    method,
    remark,
    orderNo
  };
  if(!Array.isArray(order.payments)) order.payments = [];
  order.payments.push(pay);
  order.paid = Number(order.paid || 0) + amount;
  order.debt = Math.max(0, debtBefore - amount);
  if(order.debt <= 0){
    order.status = "已结清";
    order.displayStatus = "已结清";
  }else{
    order.status = "部分还款";
    order.displayStatus = "部分还款";
  }
  if(!Array.isArray(buyer.payments)) buyer.payments = [];
  buyer.payments.push(pay);
  recalcBuyerV47Debt(buyer.id);
  if(typeof renderOrdersCenter === "function") renderOrdersCenter();
  if(typeof renderCashierCustomers === "function") renderCashierCustomers();
  closeBuyerV47Payment();
  renderBuyerV47();
  toast("还款已记录，买家欠款已更新");
}

function patchBuyerManagerV47Nav(){
  document.querySelectorAll("#globalUnifiedNavV41 .v41-nav-btn").forEach(btn=>{
    const t = (btn.textContent || "").trim();
    if(t === "客户" || t === "买家管理"){
      btn.textContent = "买家管理";
      btn.onclick = openBuyerManagerV47;
    }
  });
  document.querySelectorAll(".cashier-nav-btn,.stock-nav-btn,.orders-nav-btn,.side-item").forEach(btn=>{
    const t = (btn.textContent || "").trim();
    if(t === "客户" || t === "买家管理"){
      btn.textContent = "买家管理";
      btn.onclick = openBuyerManagerV47;
    }
  });
}

document.addEventListener("DOMContentLoaded", function(){
  ensureBuyerV47TempCustomer();
  if(typeof renderCashierCustomers === "function") renderCashierCustomers();
  patchBuyerManagerV47Nav();
  setTimeout(patchBuyerManagerV47Nav,300);
  setTimeout(patchBuyerManagerV47Nav,1000);
});

/* extracted script block 8 */
function safePrintBuyerV47Orders(){
  try{
    var modal = document.querySelector("#buyerManagerV47");
    if(!modal){
      alert("请先打开买家管理。");
      return;
    }

    var buyerName = "当前买家";
    var title = modal.querySelector("#buyerV47Name") || modal.querySelector(".buyer-v47-top h2");
    if(title && title.textContent){
      buyerName = title.textContent.trim();
    }

    var billText = "";
    var bill = modal.querySelector("#buyerV47BillText") || modal.querySelector(".buyer-v47-bill-text");
    if(bill){
      billText = bill.value || bill.textContent || "";
    }

    var orderText = "暂无订单记录";
    var repayText = "暂无还款记录";
    var sections = modal.querySelectorAll(".buyer-v47-section");
    for(var i=0;i<sections.length;i++){
      var text = sections[i].innerText || "";
      if(text.indexOf("买家全部订单记录") >= 0 || text.indexOf("买家全部订单") >= 0){
        orderText = text;
      }
      if(text.indexOf("还款记录") >= 0){
        repayText = text;
      }
    }

    function esc(s){
      return String(s || "")
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;");
    }

    var printHtml = "";
    printHtml += "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>客户订单打印</title>";
    printHtml += "</head><body>";
    printHtml += "<div class='actions'><button onclick='window.print()'>打印 / 选择蓝牙打印机</button><button onclick='window.close()' style='background:#777;'>关闭</button></div>";
    printHtml += "<h1>仓頡客户订单</h1>";
    printHtml += "<div class='sub'>买家：" + esc(buyerName) + "　生成时间：" + esc(new Date().toLocaleString()) + "</div>";
    printHtml += "<h2>买家账单</h2><div class='box'>" + esc(billText) + "</div>";
    printHtml += "<h2>订单记录</h2><div class='box'>" + esc(orderText) + "</div>";
    printHtml += "<h2>还款记录</h2><div class='box'>" + esc(repayText) + "</div>";
    printHtml += "</body></html>";

    var w = window.open("", "_blank");
    if(!w){
      alert("浏览器拦截了打印窗口，请允许弹窗后再试。");
      return;
    }
    w.document.open();
    w.document.write(printHtml);
    w.document.close();
    w.focus();
    setTimeout(function(){ w.print(); }, 300);
  }catch(err){
    console.error(err);
    alert("打印失败，但不会影响其它功能。");
  }
}

/* extracted script block 9 */
/* ===== V49：点击商品显示该商品所有批次 ===== */
function getProductBatchesForCashier(goodsId){
  var result = [];
  if(typeof batches === "undefined" || !Array.isArray(batches)) return result;
  batches.forEach(function(b){
    if(!b || !Array.isArray(b.items)) return;
    b.items.forEach(function(item){
      if(item && item.goodsId === goodsId){
        var g = (typeof goodsMaster !== "undefined" && Array.isArray(goodsMaster))
          ? goodsMaster.find(function(x){ return x.id === goodsId; })
          : null;
        var qty = Math.max(Number(item.qty || 0) - Number(item.sold || 0), 0);
        var pack = item.pack || (g && g.pack) || "非定装";
        var spec = item.spec || (g && g.spec) || "";
        var weight = pack === "定装" ? qty * Number(spec || 0) : Number(item.weight || 0);
        result.push({
          goodsId: goodsId,
          goodsName: (g && g.name) || item.name || item.productName || "未命名货品",
          batchId: b.id,
          batchNo: b.no || b.batchNo || "-",
          owner: b.owner || b.ownerName || "-",
          type: b.tag || b.type || b.batchType || "-",
          qty: qty,
          weight: weight,
          pack: pack,
          spec: spec,
          unit: item.unit || (g && g.unit) || "件",
          price: Number((g && g.price) || item.price || item.salePrice || item.fixedPrice || 0),
          item: item,
          relatedBatch: item
        });
      }
    });
  });
  return result;
}

function openProductBatchPicker(goodsId){
  try{
    var list = getProductBatchesForCashier(goodsId);
    var mask = document.getElementById("productBatchPickerMask");
    var body = document.getElementById("productBatchPickerBody");
    var title = document.getElementById("productBatchPickerTitle");
    if(!mask || !body) {
      addProductToCodeBill(goodsId);
      return;
    }

    var productName = list[0] ? list[0].goodsName : "该商品";
    if(title) title.textContent = "选择批次：" + productName;

    if(!list.length){
      body.innerHTML = '<div class="product-batch-empty">该商品暂未找到批次。<br>请先在批次里确认入库。</div>';
    }else{
      body.innerHTML = list.map(function(b){
        return '<div class="product-batch-option" data-goods-id="' + esc(b.goodsId) + '" data-batch-id="' + esc(b.batchId) + '" onclick="chooseProductBatchForCashier(this.dataset.goodsId, this.dataset.batchId)">' +
          '<div class="product-batch-option-top">' +
            '<div class="product-batch-option-title">' + esc(b.owner) + '｜' + esc(b.batchNo) + '</div>' +
            '<div class="product-batch-option-tags">' +
              '<span class="product-batch-option-tag">' + esc(b.type) + '</span>' +
              '<span class="product-batch-option-tag">' + esc(b.pack) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="product-batch-option-meta">' +
            '<span>商品：' + esc(b.goodsName) + '</span>' +
            '<span>剩余数量：' + esc(b.qty) + esc(b.unit) + '</span>' +
            '<span>剩余重量：' + esc(b.weight) + '斤</span>' +
            '<span>售价：' + Number(b.price || 0).toFixed(2) + '</span>' +
          '</div>' +
        '</div>';
      }).join("");
    }
    mask.classList.add("show");
  }catch(e){
    console.error(e);
    addProductToCodeBill(goodsId);
  }
}

function closeProductBatchPicker(){
  var mask = document.getElementById("productBatchPickerMask");
  if(mask) mask.classList.remove("show");
}

function chooseProductBatchForCashier(goodsId, batchId){
  closeProductBatchPicker();
  if(typeof addProductToCodeBill === "function"){
    addProductToCodeBill(goodsId, batchId);
  }
}

/* extracted script block 10 */
/* ===== V50：最终覆盖收银商品显示逻辑，商品卡片正面显示批次 ===== */
(function(){
  window.getCashierProducts = function(skipLetterFilter){
    var qEl = document.getElementById("cashierProductSearch");
    var modeEl = document.getElementById("cashierProductMode");
    var q = ((qEl && qEl.value) || "").toLowerCase();
    var mode = (modeEl && modeEl.value) || "";
    var selectedBatch = (typeof batches !== "undefined" && Array.isArray(batches))
      ? batches.find(function(b){ return b.id === cashierSelectedBatch; })
      : null;

    function makeGoodsFromBatchItem(b, item){
      var g = (typeof goodsMaster !== "undefined" && Array.isArray(goodsMaster))
        ? (goodsMaster.find(function(x){ return x.id === item.goodsId; }) || {})
        : {};
      var remainQty = Math.max(Number(item.qty || 0) - Number(item.sold || 0), 0);
      var pack = item.pack || g.pack || "非定装";
      var spec = item.spec || g.spec || "";
      var soldWeight = Number(item.soldWeight || 0);
      var inWeight = Number(item.weight || g.stockWeight || 0);
      if(pack !== "定装" && remainQty <= 0 && inWeight > 0 && soldWeight < inWeight) soldWeight = inWeight;
      var remainWeight = pack === "定装" ? remainQty * Number(spec || 0) : Math.max(inWeight - soldWeight, 0);
      return Object.assign({}, g, {
        id: g.id || item.goodsId,
        goodsId: item.goodsId,
        name: g.name || item.name || item.productName || "未命名货品",
        category: g.category || item.category || "",
        pack: pack,
        spec: spec,
        unit: item.unit || g.unit || "件",
        price: Number(g.price ?? item.price ?? item.salePrice ?? item.fixedPrice ?? 0),
        stockQty: remainQty,
        stockWeight: remainWeight,
        batchItemId: item.id || item.goodsId,
        batchId: b.id,
        batchNo: b.no || b.batchNo || "-",
        batchOwner: b.owner || b.ownerName || "-",
        batchType: b.tag || b.type || b.batchType || "-",
        relatedBatch: item
      });
    }

    var products = [];
    if(typeof batches !== "undefined" && Array.isArray(batches)){
      if(selectedBatch){
        products = (selectedBatch.items || []).map(function(item){ return makeGoodsFromBatchItem(selectedBatch, item); });
      }else{
        products = batches.flatMap(function(b){
          return (b.items || []).map(function(item){ return makeGoodsFromBatchItem(b, item); });
        });
      }
    }

    if(mode) products = products.filter(function(g){ return g.pack === mode; });
    if(!skipLetterFilter && typeof cashierSelectedCat !== "undefined" && cashierSelectedCat && cashierSelectedCat !== "全部"){
      products = products.filter(function(g){ return firstGoodsChar(g.name) === cashierSelectedCat; });
    }
    if(q){
      products = products.filter(function(g){
        return [g.name,g.category,g.pack,g.batchNo,g.batchOwner,g.batchType].join(" ").toLowerCase().includes(q);
      });
    }
    return products;
  };

  window.renderCashierProducts = function(){
    var box = document.getElementById("cashierProducts");
    if(!box) return;
    var products = window.getCashierProducts();
    box.innerHTML = products.map(function(g){
      var fixed = g.pack === "定装";
      var active = (typeof currentCodeBillItems !== "undefined" ? currentCodeBillItems : []).some(function(i){
        return i.goodsId === g.id && (!g.batchNo || i.batchNo === g.batchNo);
      });
      var hasStock = Number(g.stockQty || 0) > 0 || Number(g.stockWeight || 0) > 0;
      var stockClass = hasStock ? "in-stock" : "out-stock";
      var stockText = hasStock
        ? "库存：" + g.stockQty + esc(g.unit || "件") + "（" + g.stockWeight + "斤）"
        : "库存：" + g.stockQty + esc(g.unit || "件") + "（" + g.stockWeight + "斤）｜允许继续销售";
      var batchOwner = g.batchOwner || "未标记货主";
      var batchNo = g.batchNo || "未标记批次";
      var batchType = g.batchType || "批次";
      return '' +
        '<div class="cashier-product-card ' + stockClass + ' ' + (active ? 'active' : '') + '" data-goods-id="' + esc(g.id) + '" data-batch-id="' + esc(g.batchId || '') + '" role="button" tabindex="0">' +
          '<div class="cashier-product-name">' + esc(g.name) + '</div>' +
          '<div class="cashier-card-batch-info">' + esc(batchOwner) + '｜' + esc(batchNo) + '｜' + esc(batchType) + '</div>' +
          '<div class="cashier-product-meta ' + (fixed ? 'fixed' : 'loose') + '">' +
            (fixed ? ('定装｜' + esc(g.spec || 0) + '斤/' + esc(g.unit || "件") + '｜开单填售价') : '非定装｜开单输入斤数和价钱') +
          '</div>' +
          '<div class="cashier-product-meta">' + stockText + '</div>' +
        '</div>';
    }).join("") || '<div class="order-empty">当前没有可售货品。<br>请先在入库模块把货品加入批次。</div>';
    Array.prototype.forEach.call(box.querySelectorAll(".cashier-product-card[data-goods-id]"), function(card){
      if(card.__cashierClickBoundV1) return;
      card.__cashierClickBoundV1 = true;
      card.style.cursor = "pointer";
      card.addEventListener("click", function(){
        var goodsId = card.getAttribute("data-goods-id") || "";
        var batchId = card.getAttribute("data-batch-id") || "";
        if(!goodsId || typeof window.addProductToCodeBill !== "function") return;
        window.addProductToCodeBill(goodsId, batchId);
      });
      card.addEventListener("keydown", function(evt){
        if(evt.key !== "Enter" && evt.key !== " ") return;
        evt.preventDefault();
        card.click();
      });
    });
  };

  window.selectCashierAllBatches = function(){
    cashierSelectedBatch = "";
    cashierSelectedCat = "全部";
    if(typeof renderCashierBatches === "function") renderCashierBatches();
    if(typeof renderCashierCatbar === "function") renderCashierCatbar();
    window.renderCashierProducts();
  };

  window.selectCashierBatch = function(id){
    cashierSelectedBatch = cashierSelectedBatch === id ? "" : id;
    cashierSelectedCat = "全部";
    if(typeof renderCashierBatches === "function") renderCashierBatches();
    if(typeof renderCashierCatbar === "function") renderCashierCatbar();
    window.renderCashierProducts();
  };

  cashierSelectedBatch = "";
  setTimeout(function(){
    if(typeof renderCashierBatches === "function") renderCashierBatches();
    if(typeof renderCashierCatbar === "function") renderCashierCatbar();
    window.renderCashierProducts();
  }, 0);
})();

/* extracted script block 11 */
/* ===== V51：批次修改功能 ===== */
function getV51CurrentBatch(){
  if(typeof activeBatch === "function"){
    var b = activeBatch();
    if(b) return b;
  }
  if(typeof activeBatchId !== "undefined" && typeof batches !== "undefined" && Array.isArray(batches)){
    return batches.find(function(x){ return x.id === activeBatchId; }) || batches[0];
  }
  if(typeof cashierSelectedBatch !== "undefined" && cashierSelectedBatch && typeof batches !== "undefined" && Array.isArray(batches)){
    return batches.find(function(x){ return x.id === cashierSelectedBatch; }) || batches[0];
  }
  if(typeof batches !== "undefined" && Array.isArray(batches)){
    return batches[0];
  }
  return null;
}

function openV51EditBatchModal(){
  var b = getV51CurrentBatch();
  if(!b){
    alert("请先选择一个批次。");
    return;
  }
  var owner = document.getElementById("v51EditBatchOwner");
  var no = document.getElementById("v51EditBatchNo");
  var tag = document.getElementById("v51EditBatchTag");
  var remark = document.getElementById("v51EditBatchRemark");
  if(owner) owner.value = b.owner || "";
  if(no) no.value = b.no || "";
  if(tag) tag.value = b.tag || b.type || "自营";
  if(remark) remark.value = b.remark || b.note || "";
  var mask = document.getElementById("v51BatchEditMask");
  if(mask) mask.classList.add("show");
}

function closeV51EditBatchModal(){
  var mask = document.getElementById("v51BatchEditMask");
  if(mask) mask.classList.remove("show");
}

function saveV51EditBatch(){
  var b = getV51CurrentBatch();
  if(!b){
    alert("没有找到当前批次。");
    return;
  }
  var owner = (document.getElementById("v51EditBatchOwner") || {}).value || "";
  var no = (document.getElementById("v51EditBatchNo") || {}).value || "";
  var tag = (document.getElementById("v51EditBatchTag") || {}).value || "";
  var remark = (document.getElementById("v51EditBatchRemark") || {}).value || "";

  owner = owner.trim();
  no = no.trim();
  if(!owner){
    alert("请填写货主 / 来源。");
    return;
  }
  if(!no){
    alert("请填写批次号。");
    return;
  }

  b.owner = owner;
  b.no = no;
  b.tag = tag || b.tag || "自营";
  b.type = b.tag;
  b.remark = remark;
  b.note = remark;

  if(typeof owners !== "undefined" && Array.isArray(owners) && owner && !owners.includes(owner)){
    owners.push(owner);
  }

  closeV51EditBatchModal();

  if(typeof renderAll === "function") renderAll();
  if(typeof renderInventoryView === "function") renderInventoryView();
  if(typeof renderCashierBatches === "function") renderCashierBatches();
  if(typeof renderCashierProducts === "function") renderCashierProducts();

  if(typeof toast === "function"){
    toast("批次已修改");
  }else{
    alert("批次已修改");
  }
}

/* extracted script block 12 */
/* ===== V51：保证批次页能看到修改批次按钮 ===== */
(function(){
  function ensureV51EditButton(){
    if(document.querySelector(".v51-edit-batch-btn")) return;
    var candidates = Array.from(document.querySelectorAll("button"));
    var anchor = candidates.find(function(btn){
      var txt = (btn.textContent || "").trim();
      return txt === "刷新批次" || txt === "返回批次" || txt === "创建批次";
    });
    if(anchor && anchor.parentNode){
      var btn = document.createElement("button");
      btn.className = "v51-edit-batch-btn";
      btn.textContent = "修改批次";
      btn.onclick = openV51EditBatchModal;
      anchor.parentNode.insertBefore(btn, anchor);
    }
  }
  setTimeout(ensureV51EditButton, 0);
  document.addEventListener("click", function(){
    setTimeout(ensureV51EditButton, 0);
  });
})();

/* extracted script block 13 */
/* ===== V52：批次修改功能，强制插入到批次右上角 ===== */
function getV52CurrentBatch(){
  if(typeof activeBatch === "function"){
    var b = activeBatch();
    if(b) return b;
  }
  if(typeof activeBatchId !== "undefined" && typeof batches !== "undefined" && Array.isArray(batches)){
    return batches.find(function(x){ return x.id === activeBatchId; }) || batches[0];
  }
  if(typeof batches !== "undefined" && Array.isArray(batches)){
    return batches[0];
  }
  return null;
}

function openV52EditBatchModal(){
  var b = getV52CurrentBatch();
  if(!b){
    alert("请先选择一个批次。");
    return;
  }
  document.getElementById("v52EditBatchOwner").value = b.owner || "";
  document.getElementById("v52EditBatchNo").value = b.no || "";
  document.getElementById("v52EditBatchTag").value = b.tag || b.type || "自营";
  document.getElementById("v52EditBatchRemark").value = b.remark || b.note || "";
  document.getElementById("v52BatchEditMask").classList.add("show");
}

function closeV52EditBatchModal(){
  document.getElementById("v52BatchEditMask").classList.remove("show");
}

function saveV52EditBatch(){
  var b = getV52CurrentBatch();
  if(!b){
    alert("没有找到当前批次。");
    return;
  }
  var owner = document.getElementById("v52EditBatchOwner").value.trim();
  var no = document.getElementById("v52EditBatchNo").value.trim();
  var tag = document.getElementById("v52EditBatchTag").value;
  var remark = document.getElementById("v52EditBatchRemark").value;

  if(!owner){
    alert("请填写货主 / 来源。");
    return;
  }
  if(!no){
    alert("请填写批次号。");
    return;
  }

  b.owner = owner;
  b.no = no;
  b.tag = tag;
  b.type = tag;
  b.remark = remark;
  b.note = remark;

  if(typeof owners !== "undefined" && Array.isArray(owners) && owner && !owners.includes(owner)){
    owners.push(owner);
  }

  closeV52EditBatchModal();

  if(typeof renderAll === "function") renderAll();
  if(typeof renderInventoryView === "function") renderInventoryView();
  if(typeof renderInventorySummary === "function") renderInventorySummary();
  if(typeof renderCashierBatches === "function") renderCashierBatches();
  if(typeof renderCashierProducts === "function") renderCashierProducts();

  if(typeof toast === "function") toast("批次已修改");
  else alert("批次已修改");
}

function ensureV52BatchEditButton(){
  if(document.querySelector(".v52-edit-batch-btn")) return;

  var buttons = Array.from(document.querySelectorAll("button"));
  var refreshBtn = buttons.find(function(btn){
    return (btn.textContent || "").trim() === "刷新批次";
  });
  var backBtn = buttons.find(function(btn){
    return (btn.textContent || "").trim() === "返回批次";
  });

  var anchor = refreshBtn || backBtn;
  if(anchor && anchor.parentNode){
    var btn = document.createElement("button");
    btn.className = "v52-edit-batch-btn";
    btn.textContent = "修改批次";
    btn.onclick = openV52EditBatchModal;
    anchor.parentNode.insertBefore(btn, refreshBtn || anchor.nextSibling);
  }
}

setTimeout(ensureV52BatchEditButton, 0);
document.addEventListener("click", function(){
  setTimeout(ensureV52BatchEditButton, 0);
});

/* extracted script block 14 */
/* ===== V53：批次总览修改批次功能 ===== */
function getV53SelectedBatch(){
  if(typeof activeBatchId !== "undefined" && typeof batches !== "undefined" && Array.isArray(batches)){
    return batches.find(function(x){ return x.id === activeBatchId; }) || batches[0];
  }
  if(typeof activeBatch === "function"){
    var b = activeBatch();
    if(b) return b;
  }
  if(typeof batches !== "undefined" && Array.isArray(batches)){
    return batches[0];
  }
  return null;
}

function openV53EditBatchModal(){
  var b = getV53SelectedBatch();
  if(!b){
    alert("请先选择一个批次。");
    return;
  }
  document.getElementById("v53EditBatchOwner").value = b.owner || "";
  document.getElementById("v53EditBatchNo").value = b.no || "";
  document.getElementById("v53EditBatchTag").value = b.tag || b.type || "自营";
  document.getElementById("v53EditBatchRemark").value = b.remark || b.note || "";
  document.getElementById("v53BatchEditMask").classList.add("show");
}

function closeV53EditBatchModal(){
  document.getElementById("v53BatchEditMask").classList.remove("show");
}

function saveV53EditBatch(){
  var b = getV53SelectedBatch();
  if(!b){
    alert("没有找到当前批次。");
    return;
  }
  var owner = document.getElementById("v53EditBatchOwner").value.trim();
  var no = document.getElementById("v53EditBatchNo").value.trim();
  var tag = document.getElementById("v53EditBatchTag").value;
  var remark = document.getElementById("v53EditBatchRemark").value;

  if(!owner){
    alert("请填写货主 / 来源。");
    return;
  }
  if(!no){
    alert("请填写批次号。");
    return;
  }

  b.owner = owner;
  b.no = no;
  b.tag = tag;
  b.type = tag;
  b.remark = remark;
  b.note = remark;

  if(typeof owners !== "undefined" && Array.isArray(owners) && owner && !owners.includes(owner)){
    owners.push(owner);
  }

  closeV53EditBatchModal();

  if(typeof renderAll === "function") renderAll();
  if(typeof showInventoryView === "function") showInventoryView();
  if(typeof renderInventoryView === "function") renderInventoryView();
  if(typeof renderCashierBatches === "function") renderCashierBatches();
  if(typeof renderCashierProducts === "function") renderCashierProducts();

  if(typeof toast === "function") toast("批次已修改");
  else alert("批次已修改");
}

/* 强制把修改批次按钮插入到截图右上角工具栏 */
function ensureV53BatchEditButton(){
  if(document.querySelector(".v53-edit-batch-btn")) return;

  var btns = Array.from(document.querySelectorAll("button"));
  var backBtn = btns.find(function(b){ return (b.textContent || "").trim() === "返回批次"; });
  var refreshBtn = btns.find(function(b){ return (b.textContent || "").trim() === "刷新批次"; });
  var anchor = refreshBtn || backBtn;
  if(anchor && anchor.parentNode){
    var btn = document.createElement("button");
    btn.className = "v53-edit-batch-btn";
    btn.textContent = "修改批次";
    btn.onclick = openV53EditBatchModal;
    anchor.parentNode.insertBefore(btn, refreshBtn || anchor.nextSibling);
  }
}
setTimeout(ensureV53BatchEditButton, 50);
setTimeout(ensureV53BatchEditButton, 300);
document.addEventListener("click", function(){
  setTimeout(ensureV53BatchEditButton, 50);
});

/* extracted script block 15 */
/* ===== V54：修复“修改批次”按钮能显示但不能使用 ===== */
(function(){
  function currentBatchByScreen(){
    if(typeof batches === "undefined" || !Array.isArray(batches) || !batches.length) return null;

    // 1. 优先使用 activeBatchId
    if(typeof activeBatchId !== "undefined" && activeBatchId){
      var byActive = batches.find(function(b){ return b.id === activeBatchId; });
      if(byActive) return byActive;
    }

    // 2. 根据左侧当前绿色选中的批次卡片文字匹配
    var activeCard = document.querySelector(".batch-card.active, .inventory-batch-card.active, .cashier-batch-card.active");
    if(!activeCard){
      var cards = Array.from(document.querySelectorAll(".batch-card, .inventory-batch-card, .cashier-batch-card"));
      activeCard = cards.find(function(card){
        var txt = card.innerText || "";
        return txt.includes("001") || txt.includes("002") || txt.includes("003");
      });
    }
    if(activeCard){
      var txt = activeCard.innerText || "";
      var found = batches.find(function(b){
        return txt.includes(String(b.no || "")) && txt.includes(String(b.owner || ""));
      });
      if(found) return found;
    }

    // 3. 根据页面标题匹配当前批次货主
    var pageText = document.body.innerText || "";
    var foundByTitle = batches.find(function(b){
      return pageText.includes(String(b.owner || "")) && pageText.includes(String(b.no || ""));
    });
    if(foundByTitle) return foundByTitle;

    return batches[0];
  }

  window.openV54EditBatchModal = function(){
    var b = currentBatchByScreen();
    if(!b){
      alert("请先选择一个批次。");
      return;
    }

    var mask = document.getElementById("v53BatchEditMask") || document.getElementById("v52BatchEditMask") || document.getElementById("v51BatchEditMask");
    if(!mask){
      alert("修改弹窗不存在，请刷新页面后再试。");
      return;
    }

    var owner = document.getElementById("v53EditBatchOwner") || document.getElementById("v52EditBatchOwner") || document.getElementById("v51EditBatchOwner");
    var no = document.getElementById("v53EditBatchNo") || document.getElementById("v52EditBatchNo") || document.getElementById("v51EditBatchNo");
    var tag = document.getElementById("v53EditBatchTag") || document.getElementById("v52EditBatchTag") || document.getElementById("v51EditBatchTag");
    var remark = document.getElementById("v53EditBatchRemark") || document.getElementById("v52EditBatchRemark") || document.getElementById("v51EditBatchRemark");

    if(owner) owner.value = b.owner || "";
    if(no) no.value = b.no || "";
    if(tag) tag.value = b.tag || b.type || "自营";
    if(remark) remark.value = b.remark || b.note || "";

    mask.dataset.batchId = b.id || "";
    mask.classList.add("show");
  };

  window.closeV54EditBatchModal = function(){
    var mask = document.getElementById("v53BatchEditMask") || document.getElementById("v52BatchEditMask") || document.getElementById("v51BatchEditMask");
    if(mask) mask.classList.remove("show");
  };

  window.saveV54EditBatch = function(){
    var mask = document.getElementById("v53BatchEditMask") || document.getElementById("v52BatchEditMask") || document.getElementById("v51BatchEditMask");
    var id = mask ? mask.dataset.batchId : "";
    var b = null;

    if(typeof batches !== "undefined" && Array.isArray(batches)){
      if(id) b = batches.find(function(x){ return x.id === id; });
      if(!b) b = currentBatchByScreen();
    }

    if(!b){
      alert("没有找到当前批次。");
      return;
    }

    var owner = document.getElementById("v53EditBatchOwner") || document.getElementById("v52EditBatchOwner") || document.getElementById("v51EditBatchOwner");
    var no = document.getElementById("v53EditBatchNo") || document.getElementById("v52EditBatchNo") || document.getElementById("v51EditBatchNo");
    var tag = document.getElementById("v53EditBatchTag") || document.getElementById("v52EditBatchTag") || document.getElementById("v51EditBatchTag");
    var remark = document.getElementById("v53EditBatchRemark") || document.getElementById("v52EditBatchRemark") || document.getElementById("v51EditBatchRemark");

    var newOwner = owner ? owner.value.trim() : "";
    var newNo = no ? no.value.trim() : "";
    var newTag = tag ? tag.value : "";
    var newRemark = remark ? remark.value : "";

    if(!newOwner){
      alert("请填写货主 / 来源。");
      return;
    }
    if(!newNo){
      alert("请填写批次号。");
      return;
    }

    b.owner = newOwner;
    b.no = newNo;
    b.tag = newTag || b.tag || "自营";
    b.type = b.tag;
    b.remark = newRemark;
    b.note = newRemark;

    if(typeof owners !== "undefined" && Array.isArray(owners) && newOwner && !owners.includes(newOwner)){
      owners.push(newOwner);
    }

    if(mask) mask.classList.remove("show");

    // 强制刷新所有可能的批次/库存/收银视图
    try{ if(typeof renderAll === "function") renderAll(); }catch(e){}
    try{ if(typeof renderBatchList === "function") renderBatchList(); }catch(e){}
    try{ if(typeof renderInventoryView === "function") renderInventoryView(); }catch(e){}
    try{ if(typeof showInventoryView === "function") showInventoryView(); }catch(e){}
    try{ if(typeof renderCashierBatches === "function") renderCashierBatches(); }catch(e){}
    try{ if(typeof renderCashierProducts === "function") renderCashierProducts(); }catch(e){}
    try{ if(typeof renderDetail === "function") renderDetail(); }catch(e){}

    if(typeof toast === "function") toast("批次已修改");
    else alert("批次已修改");
  };

  function bindEditButtons(){
    var buttons = Array.from(document.querySelectorAll("button"));
    buttons.forEach(function(btn){
      var txt = (btn.textContent || "").trim();
      if(txt === "修改批次"){
        btn.onclick = function(ev){
          ev.preventDefault();
          ev.stopPropagation();
          window.openV54EditBatchModal();
          return false;
        };
      }
    });

    var saveBtns = Array.from(document.querySelectorAll("button"));
    saveBtns.forEach(function(btn){
      var txt = (btn.textContent || "").trim();
      if(txt === "保存修改" && btn.closest(".v53-batch-edit-modal, .v52-batch-edit-modal, .v51-batch-edit-modal")){
        btn.onclick = function(ev){
          ev.preventDefault();
          ev.stopPropagation();
          window.saveV54EditBatch();
          return false;
        };
      }
      if(txt === "取消" && btn.closest(".v53-batch-edit-modal, .v52-batch-edit-modal, .v51-batch-edit-modal")){
        btn.onclick = function(ev){
          ev.preventDefault();
          ev.stopPropagation();
          window.closeV54EditBatchModal();
          return false;
        };
      }
    });

    var closeBtns = Array.from(document.querySelectorAll(".v53-batch-edit-close,.v52-batch-edit-close,.v51-batch-edit-close"));
    closeBtns.forEach(function(btn){
      btn.onclick = function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        window.closeV54EditBatchModal();
        return false;
      };
    });
  }

  setTimeout(bindEditButtons, 0);
  setTimeout(bindEditButtons, 300);
  setTimeout(bindEditButtons, 800);
  document.addEventListener("click", function(){
    setTimeout(bindEditButtons, 30);
  });
})();

/* extracted script block 16 */
/* ===== V55：修改批次回到原批次编辑界面，不再弹窗 ===== */
function getV55CurrentOverviewBatch(){
  if(typeof activeBatchId !== "undefined" && typeof batches !== "undefined" && Array.isArray(batches)){
    var b = batches.find(function(x){ return x.id === activeBatchId; });
    if(b) return b;
  }

  if(typeof activeBatch === "function"){
    var ab = activeBatch();
    if(ab) return ab;
  }

  if(typeof batches !== "undefined" && Array.isArray(batches) && batches.length){
    var activeText = "";
    var selectedCard = document.querySelector(".batch-card.active, .inventory-batch-card.active, .cashier-batch-card.active");
    if(selectedCard) activeText = selectedCard.innerText || "";

    if(activeText){
      var found = batches.find(function(b){
        return activeText.includes(String(b.owner || "")) && activeText.includes(String(b.no || ""));
      });
      if(found) return found;
    }

    return batches[0];
  }

  return null;
}

function goBackToBatchEditFromOverview(){
  var b = getV55CurrentOverviewBatch();
  if(!b){
    alert("请先选择一个批次。");
    return;
  }

  // 设置当前正在编辑的批次
  if(typeof activeBatchId !== "undefined"){
    activeBatchId = b.id;
  }

  // 关闭可能残留的弹窗遮罩
  ["v53BatchEditMask","v52BatchEditMask","v51BatchEditMask"].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.classList.remove("show");
  });

  // 回到原入库 / 创建批次编辑界面
  try{
    if(typeof showAppPage === "function"){
      showAppPage("inbound");
    }
  }catch(e){}

  try{
    if(typeof showInboundView === "function"){
      showInboundView();
    }
  }catch(e){}

  try{
    if(typeof hideInventoryView === "function"){
      hideInventoryView();
    }
  }catch(e){}

  // 原文件里库存/批次总览通常是 inventoryView，入库编辑通常是 inboundRoot 内的主编辑区。
  var inventoryView = document.getElementById("inventoryView");
  if(inventoryView){
    inventoryView.style.display = "none";
  }

  var inboundRoot = document.getElementById("inboundRoot");
  if(inboundRoot){
    inboundRoot.style.display = "block";
  }

  var cashierRoot = document.getElementById("cashierRoot");
  if(cashierRoot){
    cashierRoot.style.display = "none";
  }

  var ordersRoot = document.getElementById("ordersRoot");
  if(ordersRoot){
    ordersRoot.style.display = "none";
  }

  // 强制让页面 body 回到入库状态
  document.body.classList.remove("show-cashier");
  document.body.classList.remove("show-orders");
  document.body.classList.add("show-inbound");

  // 刷新原编辑界面
  try{ if(typeof renderAll === "function") renderAll(); }catch(e){}
  try{ if(typeof renderBatchList === "function") renderBatchList(); }catch(e){}
  try{ if(typeof renderDetail === "function") renderDetail(); }catch(e){}
  try{ if(typeof renderCat === "function") renderCat(); }catch(e){}

  // 滚到顶部，让用户看到左侧批次和中间入库编辑表
  setTimeout(function(){
    window.scrollTo(0,0);
    var detail = document.getElementById("detailBody");
    if(detail && detail.scrollIntoView){
      detail.scrollIntoView({behavior:"smooth", block:"center"});
    }
  }, 80);

  if(typeof toast === "function"){
    toast("已回到该批次的修改界面");
  }
}

/* 绑定所有显示为“修改批次”的按钮，确保都回到编辑界面 */
(function(){
  function bindV55EditButtons(){
    Array.from(document.querySelectorAll("button")).forEach(function(btn){
      if((btn.textContent || "").trim() === "修改批次"){
        btn.onclick = function(ev){
          ev.preventDefault();
          ev.stopPropagation();
          goBackToBatchEditFromOverview();
          return false;
        };
      }
    });
  }
  setTimeout(bindV55EditButtons, 0);
  setTimeout(bindV55EditButtons, 300);
  document.addEventListener("click", function(){
    setTimeout(bindV55EditButtons, 50);
  });
})();

/* extracted script block 17 */
/* ===== V56：软件打开默认进入收银台，不再进入建立批次 ===== */
(function(){
  function openCashierOnStartupV56(){
    try{
      document.body.classList.remove("show-inbound");
      document.body.classList.remove("show-orders");
      document.body.classList.add("show-cashier");

      var inboundRoot = document.getElementById("inboundRoot");
      var cashierRoot = document.getElementById("cashierRoot");
      var ordersRoot = document.getElementById("ordersRoot");
      var inventoryView = document.getElementById("inventoryView");

      if(inboundRoot) inboundRoot.style.display = "none";
      if(inventoryView) inventoryView.style.display = "none";
      if(ordersRoot) ordersRoot.style.display = "none";
      if(cashierRoot) cashierRoot.style.display = "block";

      if(typeof renderCashierAll === "function") renderCashierAll();
      if(typeof renderCashierBatches === "function") renderCashierBatches();
      if(typeof renderCashierCatbar === "function") renderCashierCatbar();
      if(typeof renderCashierProducts === "function") renderCashierProducts();
      if(typeof renderCurrentCodeBill === "function") renderCurrentCodeBill();

      document.querySelectorAll("[data-page]").forEach(function(btn){
        var p = btn.getAttribute("data-page");
        btn.classList.toggle("active", p === "cashier");
      });

      document.querySelectorAll(".v41-nav-btn,.cashier-nav-btn,.orders-nav-btn").forEach(function(btn){
        var txt = (btn.textContent || "").trim();
        if(txt === "收银"){
          btn.classList.add("active");
        }else if(txt === "批次" || txt === "订单"){
          btn.classList.remove("active");
        }
      });
    }catch(e){
      console.error("V56 默认进入收银台失败：", e);
    }
  }

  window.openCashierOnStartupV56 = openCashierOnStartupV56;

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", function(){
      setTimeout(openCashierOnStartupV56, 0);
      setTimeout(openCashierOnStartupV56, 120);
    });
  }else{
    setTimeout(openCashierOnStartupV56, 0);
    setTimeout(openCashierOnStartupV56, 120);
  }
})();

/* extracted script block 18 */
/* ===== V57：本地数据保存，下次打开继续存在 ===== */
(function(){
  var STORAGE_KEY = "CANGJIE_APP_STATE_V1";
  var LEGACY_STORAGE_KEY = "tudou2_v57_persistent_data";
  var LOCAL_ONLY_STATUS = "当前为本机数据模式；多端同步需接入云端数据库后启用";
  var SETTINGS_KEYS_V57 = [
    "cangjieMerchantProfileV92",
    "cangjieMerchantLoginV92",
    "cangjieCurrentAccountV94",
    "cangjieCurrentAccountV93",
    "cangjieOwnerAccountV96",
    "cangjieAdminAccountV93",
    "cangjieEmployeesV94",
    "cangjieEmployeesV93",
    "currentUser",
    "tudou2_printer_config_step1",
    "cangjieCommercialSyncV1",
    "cangjiePhoneLoginV96",
    "cangjieMerchantEntryStateV1"
  ];

  function safeClone(obj){
    try{
      return JSON.parse(JSON.stringify(obj));
    }catch(e){
      return obj;
    }
  }
  function buildMinimalRuntimeSeedV57(){
    var goodsZiJiangId = "seed_goods_zijiang_v1";
    var goodsCaiXinId = "seed_goods_caixin_v1";
    var batchId = "seed_batch_001_ziying_v1";
    var buyerId = "seed_customer_test_buyer_a_v1";
    var goodsMaster = [
      {
        id:goodsZiJiangId,
        name:"子姜",
        type:"非",
        category:"根茎类",
        pack:"定装",
        grade:"不分级",
        spec:10,
        unit:"件",
        price:80,
        fixedPrice:80,
        oversell:"允许库存超卖",
        basket:"不押筐"
      },
      {
        id:goodsCaiXinId,
        name:"菜心",
        type:"非",
        category:"叶菜类",
        pack:"非定装",
        grade:"不分级",
        spec:"",
        unit:"斤",
        price:6,
        oversell:"允许库存超卖",
        basket:"不押筐"
      }
    ];
    var batch = {
      id:batchId,
      owner:"自营",
      no:"001",
      tag:"自营",
      type:"自营",
      fee:0,
      remark:"最小回测运行态 V1",
      items:[
        {
          id:"seed_batch_item_zijiang_v1",
          goodsId:goodsZiJiangId,
          name:"子姜",
          pack:"定装",
          spec:10,
          unit:"件",
          qty:10,
          weight:100,
          price:80,
          fixedPrice:80,
          sold:0,
          soldWeight:0
        },
        {
          id:"seed_batch_item_caixin_v1",
          goodsId:goodsCaiXinId,
          name:"菜心",
          pack:"非定装",
          spec:"",
          unit:"斤",
          qty:20,
          weight:20,
          price:6,
          sold:0,
          soldWeight:0
        }
      ],
      confirmed:true,
      inboundConfirmedAt:"2026-05-08 12:00:00"
    };
    var customers = [
      {id:"c1", name:"临时客户", debt:0, payments:[], parentId:"", disabled:false},
      {id:buyerId, name:"测试买家A", debt:0, payments:[], parentId:"", disabled:false}
    ];
    return {
      goodsMaster:goodsMaster,
      batches:[batch],
      owners:["自营"],
      customers:customers,
      cashierCustomers:customers,
      buyerV47List:customers,
      buyers:customers,
      activeBatchId:batchId,
      cashierSelectedBatch:"",
      cashierSelectedCat:"全部"
    };
  }
  function defaultAppStateShapeV57(){
    var seed = buildMinimalRuntimeSeedV57();
    return {
      stateVersion:1,
      goodsMaster:safeClone(seed.goodsMaster || []),
      batches:safeClone(seed.batches || []),
      owners:safeClone(seed.owners || []),
      customers:safeClone(seed.customers || []),
      cashierCustomers:safeClone(seed.cashierCustomers || []),
      orders:[],
      codeBills:[],
      savedCodeBills:[],
      finalOrders:[],
      buyerV47Orders:[],
      buyerV47Repayments:[],
      buyerV47List:safeClone(seed.buyerV47List || []),
      buyers:safeClone(seed.buyers || []),
      repayments:[],
      activeBatchId:seed.activeBatchId || "",
      cashierSelectedBatch:seed.cashierSelectedBatch || "",
      cashierSelectedCat:seed.cashierSelectedCat || "全部",
      localSettings:{},
      storageMode:"local",
      storageModeLabel:LOCAL_ONLY_STATUS,
      savedAt:""
    };
  }
  function readLocalSettingV57(key, fallback){
    try{
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    }catch(err){
      return fallback;
    }
  }
  function writeLocalSettingV57(key, value){
    try{
      localStorage.setItem(key, JSON.stringify(value));
    }catch(err){}
  }
  function hasMeaningfulValueV57(value){
    if(Array.isArray(value)) return value.length > 0;
    if(value && typeof value === "object") return Object.keys(value).length > 0;
    return !(value == null || value === "");
  }
  function collectSettingsV57(){
    var settings = {};
    SETTINGS_KEYS_V57.forEach(function(key){
      var value = readLocalSettingV57(key, null);
      if(hasMeaningfulValueV57(value)) settings[key] = safeClone(value);
    });
    return settings;
  }
  function applySettingsV57(settings){
    settings = settings && typeof settings === "object" ? settings : {};
    SETTINGS_KEYS_V57.forEach(function(key){
      if(Object.prototype.hasOwnProperty.call(settings, key)){
        writeLocalSettingV57(key, settings[key]);
      }
    });
    try{
      var meta = readLocalSettingV57("cangjieCommercialSyncV1", {}) || {};
      meta.storageMode = "local";
      meta.storageModeLabel = LOCAL_ONLY_STATUS;
      meta.offlineAvailable = true;
      meta.multiDeviceReady = false;
      meta.dataUpdatedAt = meta.dataUpdatedAt || new Date().toISOString();
      writeLocalSettingV57("cangjieCommercialSyncV1", meta);
    }catch(err){}
  }

  function collectTudou2DataV57(){
    var data = defaultAppStateShapeV57();
    try{ if(typeof goodsMaster !== "undefined") data.goodsMaster = safeClone(goodsMaster); }catch(e){}
    try{ if(typeof batches !== "undefined") data.batches = safeClone(batches); }catch(e){}
    try{ if(typeof owners !== "undefined") data.owners = safeClone(owners); }catch(e){}
    try{ if(typeof customers !== "undefined") data.customers = safeClone(customers); }catch(e){}
    try{ if(typeof cashierCustomers !== "undefined") data.cashierCustomers = safeClone(cashierCustomers); }catch(e){}
    try{ if(typeof orders !== "undefined") data.orders = safeClone(orders); }catch(e){}
    try{ if(typeof codeBills !== "undefined") data.codeBills = safeClone(codeBills); }catch(e){}
    try{ if(typeof savedCodeBills !== "undefined") data.savedCodeBills = safeClone(savedCodeBills); }catch(e){}
    try{ if(typeof finalOrders !== "undefined") data.finalOrders = safeClone(finalOrders); }catch(e){}
    try{ if(typeof buyerV47Orders !== "undefined") data.buyerV47Orders = safeClone(buyerV47Orders); }catch(e){}
    try{ if(typeof buyerV47Repayments !== "undefined") data.buyerV47Repayments = safeClone(buyerV47Repayments); }catch(e){}
    try{ if(typeof buyerV47List !== "undefined") data.buyerV47List = safeClone(buyerV47List); }catch(e){}
    try{ if(typeof buyers !== "undefined") data.buyers = safeClone(buyers); }catch(e){}
    try{ if(typeof repayments !== "undefined") data.repayments = safeClone(repayments); }catch(e){}
    try{ if(typeof activeBatchId !== "undefined") data.activeBatchId = activeBatchId; }catch(e){}
    try{ if(typeof cashierSelectedBatch !== "undefined") data.cashierSelectedBatch = cashierSelectedBatch; }catch(e){}
    try{ if(typeof cashierSelectedCat !== "undefined") data.cashierSelectedCat = cashierSelectedCat; }catch(e){}
    try{ data.localSettings = collectSettingsV57(); }catch(e){}
    data.storageMode = "local";
    data.storageModeLabel = LOCAL_ONLY_STATUS;
    data.savedAt = new Date().toLocaleString("zh-CN", {hour12:false});
    return data;
  }
  function normalizeAppStateV57(data){
    var base = defaultAppStateShapeV57();
    data = data && typeof data === "object" ? data : {};
    Object.keys(base).forEach(function(key){
      if(Array.isArray(base[key])){
        base[key] = Array.isArray(data[key]) ? safeClone(data[key]) : base[key];
      }else if(key === "localSettings"){
        base[key] = data.localSettings && typeof data.localSettings === "object" ? safeClone(data.localSettings) : {};
      }else if(Object.prototype.hasOwnProperty.call(data, key)){
        base[key] = safeClone(data[key]);
      }
    });
    base.stateVersion = 1;
    base.storageMode = "local";
    base.storageModeLabel = LOCAL_ONLY_STATUS;
    base.savedAt = data.savedAt || base.savedAt;
    return base;
  }

  function orderPersistSignatureV57(data){
    try{
      var rows = [];
      if(data && Array.isArray(data.orders) && data.orders.length) rows = data.orders;
      if((!rows || !rows.length) && data && Array.isArray(data.finalOrders) && data.finalOrders.length) rows = data.finalOrders;
      if(!rows || !rows.length) return "";
      return JSON.stringify(rows.map(function(o){
        return [
          o && (o.orderNo || o.billNo || o.id || ""),
          o && (o.status || o.displayStatus || ""),
          o && (o.totalAmount || o.total || o.amount || 0),
          o && (o.paidAmount || o.paid || 0),
          o && (o.debtAmount || o.debt || 0),
          o && (o.time || o.createdAt || "")
        ].join("|");
      }));
    }catch(e){
      return "";
    }
  }

  function triggerCloudOrderSyncAfterPersistV57(data){
    try{
      var sig = orderPersistSignatureV57(data);
      if(!sig) return;
      var key = "cangjie_last_order_persist_signature_v1";
      var prev = localStorage.getItem(key) || "";
      if(prev === sig) return;
      localStorage.setItem(key, sig);
      console.log("订单完成触发");
      setTimeout(async function(){
        try{
          if(typeof window.pushLatestOrderToCloud === "function"){
            await window.pushLatestOrderToCloud();
          }else{
            console.log("订单云同步函数未就绪");
          }
        }catch(e){
          console.error("云端同步异常:", e);
        }
      }, 0);
    }catch(e){
      console.error("云端同步异常:", e);
    }
  }

  function rememberCurrentOrderPersistSignatureV57(){
    try{
      var data = collectTudou2DataV57();
      var sig = orderPersistSignatureV57(data);
      if(sig) localStorage.setItem("cangjie_last_order_persist_signature_v1", sig);
    }catch(e){}
  }

  function applyTudou2DataV57(data){
    data = normalizeAppStateV57(data);

    try{
      if(Array.isArray(data.goodsMaster) && typeof goodsMaster !== "undefined"){
        goodsMaster.splice.apply(goodsMaster, [0, goodsMaster.length].concat(data.goodsMaster));
      }
    }catch(e){}
    try{ if(data.batches && typeof batches !== "undefined") batches = data.batches; }catch(e){}
    try{ if(data.owners && typeof owners !== "undefined") owners = data.owners; }catch(e){}
    try{ if(data.customers && typeof customers !== "undefined") customers = data.customers; }catch(e){}
    try{ if(data.cashierCustomers && typeof cashierCustomers !== "undefined") cashierCustomers = data.cashierCustomers; }catch(e){}
    try{ if(data.orders && typeof orders !== "undefined") orders = data.orders; }catch(e){}
    try{ if(data.codeBills && typeof codeBills !== "undefined") codeBills = data.codeBills; }catch(e){}
    try{ if(data.savedCodeBills && typeof savedCodeBills !== "undefined") savedCodeBills = data.savedCodeBills; }catch(e){}
    try{ if(data.finalOrders && typeof finalOrders !== "undefined") finalOrders = data.finalOrders; }catch(e){}
    try{ if(data.buyerV47Orders && typeof buyerV47Orders !== "undefined") buyerV47Orders = data.buyerV47Orders; }catch(e){}
    try{ if(data.buyerV47Repayments && typeof buyerV47Repayments !== "undefined") buyerV47Repayments = data.buyerV47Repayments; }catch(e){}
    try{ if(data.buyerV47List && typeof buyerV47List !== "undefined") buyerV47List = data.buyerV47List; }catch(e){}
    try{ if(data.buyers && typeof buyers !== "undefined") buyers = data.buyers; }catch(e){}
    try{ if(data.repayments && typeof repayments !== "undefined") repayments = data.repayments; }catch(e){}
    try{ if(typeof data.activeBatchId !== "undefined" && typeof activeBatchId !== "undefined") activeBatchId = data.activeBatchId; }catch(e){}
    try{ if(typeof data.cashierSelectedBatch !== "undefined" && typeof cashierSelectedBatch !== "undefined") cashierSelectedBatch = data.cashierSelectedBatch; }catch(e){}
    try{ if(data.cashierSelectedCat && typeof cashierSelectedCat !== "undefined") cashierSelectedCat = data.cashierSelectedCat; }catch(e){}
    try{ applySettingsV57(data.localSettings || {}); }catch(e){}
  }

  function saveTudou2DataV57(){
    try{
      var data = normalizeAppStateV57(collectTudou2DataV57());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(data));
      triggerCloudOrderSyncAfterPersistV57(data);
      return true;
    }catch(e){
      console.error("仓頡保存失败：", e);
      return false;
    }
  }

  function hasMinimalRuntimeDataV57(data){
    data = data && typeof data === "object" ? data : {};
    return Array.isArray(data.goodsMaster) && data.goodsMaster.length >= 2 &&
      Array.isArray(data.batches) && data.batches.length >= 1 &&
      Array.isArray(data.cashierCustomers) && data.cashierCustomers.length >= 2;
  }
  function loadTudou2DataV57(){
    try{
      var raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      var data = null;
      if(raw){
        data = normalizeAppStateV57(JSON.parse(raw));
      }else{
        data = defaultAppStateShapeV57();
      }
      if(!hasMinimalRuntimeDataV57(data)){
        data = defaultAppStateShapeV57();
      }
      applyTudou2DataV57(data);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(data));
      return true;
    }catch(e){
      console.error("仓頡读取保存数据失败：", e);
      return false;
    }
  }

  function refreshAllViewsV57(){
    try{ if(typeof ensureBatchConfirmFlags === "function") ensureBatchConfirmFlags(); }catch(e){}
    try{ if(typeof renderAll === "function") renderAll(); }catch(e){}
    try{ if(typeof renderBatchList === "function") renderBatchList(); }catch(e){}
    try{ if(typeof renderInventoryView === "function") renderInventoryView(); }catch(e){}
    try{ if(typeof renderCashierAll === "function") renderCashierAll(); }catch(e){}
    try{ if(typeof renderCashierBatches === "function") renderCashierBatches(); }catch(e){}
    try{ if(typeof renderCashierCatbar === "function") renderCashierCatbar(); }catch(e){}
    try{ if(typeof renderCashierProducts === "function") renderCashierProducts(); }catch(e){}
    try{ if(typeof renderCurrentCodeBill === "function") renderCurrentCodeBill(); }catch(e){}
    try{ if(typeof renderOrders === "function") renderOrders(); }catch(e){}
    try{ if(typeof renderBuyerV47 === "function") renderBuyerV47(); }catch(e){}
    try{ if(typeof renderBuyerManagerV47 === "function") renderBuyerManagerV47(); }catch(e){}
    try{ if(typeof renderProfileV92 === "function") renderProfileV92(); }catch(e){}
    try{ if(typeof renderEmployeesV94 === "function") renderEmployeesV94(); }catch(e){}
    try{ if(typeof renderConfigStep1 === "function") renderConfigStep1(); }catch(e){}
    try{ if(typeof renderCommercialSyncPanel === "function") renderCommercialSyncPanel(); }catch(e){}
  }

  function wrapFunctionV57(name){
    try{
      var oldFn = window[name];
      if(typeof oldFn !== "function" || oldFn.__tudou2PersistWrapped) return;
      var wrapped = function(){
        var result = oldFn.apply(this, arguments);
        setTimeout(saveTudou2DataV57, 0);
        setTimeout(refreshAllViewsV57, 20);
        return result;
      };
      wrapped.__tudou2PersistWrapped = true;
      window[name] = wrapped;
    }catch(e){}
  }

  function installAutoSaveV57(){
    [
      "createBatch","saveBatch","confirmInbound","deleteBatch","renameBatch",
      "addGoods","saveGoods","deleteGoods","toggleGoodsToBatch","saveItemField","removeItem","confirmSingleItem",
      "addOwnerFromBatchModal","saveBatchFromModal","addFee","addRemark",
      "addProductToCodeBill","removeCodeBillItem","updateCodeBillItem","checkoutCurrentOrder",
      "saveCodeBill","deleteBill","completeSettleOrder","confirmOrderFromCodeBill",
      "finishOrder","submitOrder","addCashierCustomer","addBuyer","addTempBuyer",
      "saveBuyerV47","addBuyerV47","repayBuyer","repayBuyerV47",
      "saveV53EditBatch","saveV54EditBatch","saveV52EditBatch","saveV51EditBatch"
    ].forEach(wrapFunctionV57);

    document.addEventListener("change", function(e){
      var el = e.target;
      if(!el) return;
      if(el.matches("input,select,textarea")){
        setTimeout(saveTudou2DataV57, 0);
      }
    }, true);

    document.addEventListener("click", function(){
      setTimeout(saveTudou2DataV57, 80);
    }, true);

    window.addEventListener("beforeunload", function(){
      saveTudou2DataV57();
    });

    setInterval(saveTudou2DataV57, 3000);
  }

  window.tudou2SaveNow = function(options){
    var opts = options === true ? {notify:true} : (options || {});
    var ok = saveTudou2DataV57();
    if(ok){
      if(opts.notify){
        if(typeof toast === "function") toast("数据已保存，下次打开仍会保留");
        else alert("数据已保存，下次打开仍会保留");
      }
    }else if(opts.notify !== false){
      alert("保存失败，请检查浏览器是否允许本地存储。");
    }
  };

  window.tudou2ClearSavedData = function(){
    if(!confirm("确定清空本机保存的数据吗？清空后会恢复到文件内默认数据。")) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    alert("已清空本机保存数据。请重新打开文件。");
  };

  window.tudou2ExportData = function(){
    var data = collectTudou2DataV57();
    var blob = new Blob([JSON.stringify(data, null, 2)], {type:"application/json"});
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "tudou2_backup_" + new Date().toISOString().slice(0,10) + ".json";
    document.body.appendChild(a);
    a.click();
    setTimeout(function(){
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 0);
  };

  function addSaveButtonV57(){
    if(document.getElementById("tudou2SaveStatusV57")) return;
    var btn = document.createElement("button");
    btn.id = "tudou2SaveStatusV57";
    btn.textContent = "已开启本地保存";
    btn.onclick = function(){ window.tudou2SaveNow({notify:true}); };
    btn.style.position = "fixed";
    btn.style.right = "18px";
    btn.style.bottom = "18px";
    btn.style.zIndex = "9999";
    btn.style.height = "38px";
    btn.style.border = "0";
    btn.style.borderRadius = "12px";
    btn.style.background = "#1f6f3a";
    btn.style.color = "#fff";
    btn.style.padding = "0 14px";
    btn.style.fontWeight = "900";
    btn.style.cursor = "pointer";
    btn.style.boxShadow = "0 10px 24px rgba(0,0,0,.16)";
    document.body.appendChild(btn);
  }

  function bootV57(){
    loadTudou2DataV57();
    applySettingsV57(collectSettingsV57());
    rememberCurrentOrderPersistSignatureV57();
    installAutoSaveV57();
    refreshAllViewsV57();
    addSaveButtonV57();

    setTimeout(function(){
      refreshAllViewsV57();
      saveTudou2DataV57();
    }, 200);

    setTimeout(function(){
      if(typeof openCashierOnStartupV56 === "function"){
        openCashierOnStartupV56();
      }
    }, 300);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", bootV57);
  }else{
    bootV57();
  }

  window.getDefaultAppState = function(){
    return defaultAppStateShapeV57();
  };
  window.loadAppState = function(){
    return loadTudou2DataV57();
  };
  window.saveAppState = function(){
    return saveTudou2DataV57();
  };
  window.setAppState = function(nextState){
    var normalized = normalizeAppStateV57(nextState);
    applyTudou2DataV57(normalized);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(normalized));
    refreshAllViewsV57();
    return normalized;
  };
  window.updateAndSave = function(updater){
    var current = normalizeAppStateV57(collectTudou2DataV57());
    var draft = safeClone(current);
    if(typeof updater === "function"){
      var result = updater(draft);
      if(result && typeof result === "object") draft = result;
    }else if(updater && typeof updater === "object"){
      Object.assign(draft, safeClone(updater));
    }
    return window.setAppState(draft);
  };

  window.CANGJIE_DATA_ACCESS_V102 = {
    mode:"local",
    modeLabel:LOCAL_ONLY_STATUS,
    saveData:function(){
      return window.saveAppState();
    },
    loadData:function(){
      var ok = window.loadAppState();
      if(ok) refreshAllViewsV57();
      return ok;
    },
    readState:function(){
      return normalizeAppStateV57(collectTudou2DataV57());
    },
    writeState:function(nextState){
      return window.setAppState(nextState || {});
    },
    createBatch:function(batch){
      var rows = Array.isArray(batches) ? batches : [];
      var next = safeClone(batch || {});
      if(!next.id) next.id = "b" + Date.now();
      if(!Array.isArray(next.items)) next.items = [];
      rows.unshift(next);
      batches = rows;
      activeBatchId = next.id;
      saveTudou2DataV57();
      refreshAllViewsV57();
      return next;
    },
    updateBatch:function(batchId, patch){
      var hit = null;
      (Array.isArray(batches) ? batches : []).forEach(function(row){
        if(String(row.id || "") !== String(batchId || "")) return;
        Object.assign(row, safeClone(patch || {}));
        hit = row;
      });
      saveTudou2DataV57();
      refreshAllViewsV57();
      return hit;
    },
    deleteBatch:function(batchId){
      var target = (Array.isArray(batches) ? batches : []).find(function(row){ return String(row.id || "") === String(batchId || ""); }) || null;
      if(!target) return {ok:false, reason:"batch_not_found"};
      var reason = typeof stockBatchDeleteBlockReason === "function" ? stockBatchDeleteBlockReason(target) : "";
      if(reason) return {ok:false, reason:reason};
      batches = (Array.isArray(batches) ? batches : []).filter(function(row){ return String(row.id || "") !== String(batchId || ""); });
      if(activeBatchId === batchId) activeBatchId = (batches[0] && batches[0].id) || "";
      saveTudou2DataV57();
      refreshAllViewsV57();
      return {ok:true};
    },
    createOrder:function(order){
      var next = safeClone(order || {});
      if(!Array.isArray(finalOrders)) finalOrders = [];
      finalOrders.unshift(next);
      saveTudou2DataV57();
      refreshAllViewsV57();
      return next;
    },
    updateInventory:function(mutator){
      if(typeof mutator === "function") mutator(batches, goodsMaster);
      saveTudou2DataV57();
      refreshAllViewsV57();
      return {batches:batches, goodsMaster:goodsMaster};
    }
  };
  window.saveData = window.CANGJIE_DATA_ACCESS_V102.saveData;
  window.loadData = window.CANGJIE_DATA_ACCESS_V102.loadData;
})();

/* extracted script block 19 */
/* ===== V57 Step1：新增库存框架，只连接已确认批次与已完成订单 ===== */
(function(){
  var inventoryStep1Filter = {type:"all", value:"all", title:"全部批次"};
  var oldShowAppPageStep1 = typeof showAppPage === "function" ? showAppPage : null;

  function n(v){ return Number(v || 0) || 0; }
  function e(v){ return typeof esc === "function" ? esc(v) : String(v ?? ""); }
  function q(v){ return String(v ?? "").replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\r?\n/g, " "); }
  function m(v){ return typeof money === "function" ? money(v) : n(v).toFixed(2); }
  function fixedWeight(item, qty){
    var q = typeof qty === "number" ? qty : n(item.qty);
    return item && item.pack === "定装" ? q * n(item.spec) : n(item.weight);
  }
  function confirmedBatchesStep1(){
    try{ if(typeof ensureBatchConfirmFlags === "function") ensureBatchConfirmFlags(); }catch(err){}
    try{
      return (batches || []).filter(function(b){
        return !!(b && b.confirmed) && !(b.ownerSettled || b.ownerSettlementAt || b.saleStatus === "settled");
      });
    }catch(err){ return []; }
  }
  function completedOrdersStep1(){
    var source = [];
    try{ source = Array.isArray(finalOrders) ? finalOrders : []; }catch(err){}
    return source.filter(function(o){
      if(!o) return false;
      if(o.voided || o.status === "已作废" || o.displayStatus === "已作废") return false;
      if(typeof normalizeOrderType === "function"){
        var t = normalizeOrderType(o);
        return t === "已收银" || t === "已赊欠";
      }
      return o.status === "已收银" || o.status === "已赊欠" || o.status === "已下单" || o.orderNo;
    });
  }
  function key(owner, no, name){ return [owner || "-", no || "-", name || "-"].join("||"); }
  function salesMapStep1(){
    var map = {};
    completedOrdersStep1().forEach(function(order){
      (order.lines || []).forEach(function(line){
        var k = key(line.owner, line.batchNo, line.name);
        if(!map[k]) map[k] = {qty:0, weight:0, amount:0, orders:[]};
        map[k].qty += n(line.qty);
        map[k].weight += n(line.weight);
        map[k].amount += n(line.amount);
        map[k].orders.push({
          buyer:order.customerName || "",
          orderNo:order.orderNo || order.billNo || "",
          time:order.time || "",
          qty:n(line.qty),
          weight:n(line.weight),
          amount:n(line.amount)
        });
      });
    });
    return map;
  }
  function batchByIdStep1(id){
    try{ return (batches || []).find(function(b){ return b && b.id === id; }) || null; }catch(err){ return null; }
  }
  function itemByGoodsStep1(batch, goodsId, goodsName){
    if(!batch) return null;
    return (batch.items || []).find(function(item){
      var g = (typeof goodsMaster !== "undefined" ? goodsMaster : []).find(function(x){ return x.id === item.goodsId; }) || {};
      var name = item.name || g.name || "未命名商品";
      return String(item.goodsId || g.id || name) === String(goodsId) || name === goodsName;
    }) || null;
  }
  function batchSaleStoppedStep1(batch){
    return !!(batch && (batch.saleStopped || batch.soldOut || batch.saleStatus === "stopped" || batch.saleStatus === "soldout" || batch.salePaused || batch.settled || batch.closed));
  }
  function itemSaleStoppedStep1(item){
    return !!(item && (item.saleStopped || item.saleStatus === "stopped" || item.salePaused || item.settled || item.closed));
  }
  function batchSettledStep1(batch){
    return !!(batch && (batch.settled || batch.closed || batch.saleStatus === "settled"));
  }
  function batchSoldOutStep1(batch){
    return !!(batch && (batch.soldOut || batch.saleStatus === "soldout"));
  }
  function itemSettledStep1(item){
    return !!(item && (item.settled || item.closed || item.saleStatus === "settled"));
  }
  function refreshInventorySaleStep1(){
    try{ if(typeof renderInventoryStep1 === "function") renderInventoryStep1(); }catch(err){}
    try{ if(typeof renderCashierBatches === "function") renderCashierBatches(); }catch(err){}
    try{ if(typeof renderCashierProducts === "function") renderCashierProducts(); }catch(err){}
    try{ if(typeof tudou2SaveNow === "function") setTimeout(tudou2SaveNow, 0); }catch(err){}
  }
  function rowsStep1(){
    var sales = salesMapStep1();
    var rows = [];
    confirmedBatchesStep1().forEach(function(b){
      (b.items || []).forEach(function(item){
        var g = (typeof goodsMaster !== "undefined" ? goodsMaster : []).find(function(x){ return x.id === item.goodsId; }) || {};
        var name = item.name || g.name || "未命名商品";
        var sale = sales[key(b.owner, b.no || b.batchNo, name)] || {qty:0, weight:0, amount:0, orders:[]};
        var inQty = n(item.qty);
        var inWeight = item.pack === "定装" ? fixedWeight(item) : n(item.weight);
        var soldQty = sale.qty > 0 ? sale.qty : n(item.sold);
        var soldWeight = sale.weight > 0 ? sale.weight : (item.pack === "定装" ? soldQty * n(item.spec) : n(item.soldWeight));
        if(item.pack !== "定装" && inQty > 0 && soldQty >= inQty && inWeight > 0 && soldWeight < inWeight) soldWeight = inWeight;
        var remainQty = inQty - soldQty;
        var remainWeight = inWeight - soldWeight;
        rows.push({
          owner:b.owner || "-",
          batchId:b.id || "",
          batchNo:b.no || b.batchNo || "-",
          batchType:b.tag || b.type || "",
          goodsId:item.goodsId || g.id || name,
          goodsName:name,
          pack:item.pack || g.pack || "",
          unit:item.unit || g.unit || "件",
          inQty:inQty,
          inWeight:inWeight,
          soldQty:soldQty,
          soldWeight:soldWeight,
          remainQty:remainQty,
          remainWeight:remainWeight,
          saleAmount:sale.amount,
          orders:sale.orders,
          saleStopped:batchSaleStoppedStep1(b) || itemSaleStoppedStep1(item),
          soldOut:batchSoldOutStep1(b),
          settled:batchSettledStep1(b) || itemSettledStep1(item)
        });
      });
    });
    return rows;
  }
  function filteredRowsStep1(){
    var q = (document.getElementById("inventoryStep1Search")?.value || "").trim().toLowerCase();
    return rowsStep1().filter(function(r){
      if(inventoryStep1Filter.type === "owner" && r.owner !== inventoryStep1Filter.value) return false;
      if(inventoryStep1Filter.type === "batch" && r.batchId !== inventoryStep1Filter.value) return false;
      if(inventoryStep1Filter.type === "goods" && r.goodsId !== inventoryStep1Filter.value && r.goodsName !== inventoryStep1Filter.value) return false;
      if(!q) return true;
      return [r.owner,r.batchNo,r.batchType,r.goodsName,r.pack].join(" ").toLowerCase().includes(q);
    });
  }
  function stateText(r){
    if(r.settled || r.soldOut) return "已售完";
    if(r.saleStopped) return "已停售";
    if(r.remainQty < 0 || r.remainWeight < 0) return "超卖";
    if(r.remainQty <= 0 && r.inQty > 0) return "售完";
    return "开售中";
  }
  function inventoryGoodsSaleButtonStep1(r){
    var batch = batchByIdStep1(r.batchId);
    var item = itemByGoodsStep1(batch, r.goodsId, r.goodsName);
    var stopped = itemSaleStoppedStep1(item);
    var disabled = batchSoldOutStep1(batch) || batchSettledStep1(batch);
    var text = disabled ? "已售完" : (stopped ? "开售" : "停售");
    var cls = stopped ? "inventory-step1-sale-btn start" : "inventory-step1-sale-btn stop";
    if(disabled) cls = "inventory-step1-sale-btn";
    return '<button type="button" class="'+cls+'" '+(disabled ? "disabled" : "")+' onclick="event.stopPropagation();toggleInventoryGoodsSaleStep1(\''+e(r.batchId)+'\',\''+e(r.goodsId)+'\',\''+e(r.goodsName)+'\')">'+text+'</button>';
  }
  function amountText(qty, weight, unit){
    return n(qty) + e(unit || "件") + '<div class="inventory-step1-sub">' + n(weight) + '斤</div>';
  }
  function buildTreeStep1(allRows){
    var owners = {};
    allRows.forEach(function(r){
      if(!owners[r.owner]) owners[r.owner] = {};
      if(!owners[r.owner][r.batchId]) owners[r.owner][r.batchId] = {batchNo:r.batchNo, type:r.batchType, rows:[]};
      owners[r.owner][r.batchId].rows.push(r);
    });
    var html = '<div class="inventory-step1-node '+(inventoryStep1Filter.type==="all" ? "active" : "")+'" onclick="inventoryStep1Select(\'all\',\'all\',\'全部批次\')"><b>全部批次</b><span>'+allRows.length+' 个商品明细</span></div>';
    Object.keys(owners).forEach(function(owner){
      var ownerRows = allRows.filter(function(r){ return r.owner === owner; });
      html += '<div class="inventory-step1-node '+(inventoryStep1Filter.type==="owner" && inventoryStep1Filter.value===owner ? "active" : "")+'" onclick="inventoryStep1Select(\'owner\',\''+e(owner)+'\',\''+e(owner)+'\')"><b>'+e(owner)+'</b><span>'+Object.keys(owners[owner]).length+' 个批次｜'+ownerRows.length+' 个商品</span></div>';
      Object.keys(owners[owner]).forEach(function(batchId){
        var b = owners[owner][batchId];
        var sourceBatch = batchByIdStep1(batchId);
        var soldOutText = batchSoldOutStep1(sourceBatch) ? "｜已售完" : (batchSaleStoppedStep1(sourceBatch) ? "｜已停售" : "");
        html += '<div class="inventory-step1-node batch '+(inventoryStep1Filter.type==="batch" && inventoryStep1Filter.value===batchId ? "active" : "")+'" onclick="inventoryStep1Select(\'batch\',\''+e(batchId)+'\',\''+e(owner + '｜' + b.batchNo)+'\')"><b>批次 '+e(b.batchNo)+'</b><span>'+e(b.type)+'｜'+b.rows.length+' 个商品'+soldOutText+'</span></div>';
      });
    });
    return html;
  }
  function renderInventoryStep1(){
    var root = document.getElementById("inventoryStep1Root");
    if(!root) return;
    var allRows = rowsStep1();
    var showRows = filteredRowsStep1();
    var totals = showRows.reduce(function(s,r){
      s.inQty += r.inQty; s.inWeight += r.inWeight; s.soldQty += r.soldQty; s.soldWeight += r.soldWeight; s.remainQty += r.remainQty; s.remainWeight += r.remainWeight; s.amount += r.saleAmount;
      return s;
    }, {inQty:0,inWeight:0,soldQty:0,soldWeight:0,remainQty:0,remainWeight:0,amount:0});
    document.getElementById("inventoryStep1Tree").innerHTML = buildTreeStep1(allRows);
    document.getElementById("inventoryStep1Title").textContent = inventoryStep1Filter.title || "全部批次";
    document.getElementById("inventoryStep1Sub").textContent = "只显示已确认入库的商品；订单完成后同步已售与剩余。";
    renderInventoryBatchOpsStep1();
    document.getElementById("inventoryStep1Summary").innerHTML = [
      ["商品明细", showRows.length],
      ["入库数量", n(totals.inQty)],
      ["入库重量", n(totals.inWeight) + "斤"],
      ["已售数量", n(totals.soldQty)],
      ["已售重量", n(totals.soldWeight) + "斤"],
      ["剩余数量", n(totals.remainQty)],
      ["剩余重量", n(totals.remainWeight) + "斤"],
      ["销售金额", m(totals.amount)]
    ].map(function(x){ return '<div class="inventory-step1-card"><span>'+x[0]+'</span><b>'+x[1]+'</b></div>'; }).join("");
    document.getElementById("inventoryStep1Table").innerHTML = showRows.length ? '<table class="inventory-step1-table"><thead><tr><th>货主</th><th>批次</th><th>商品</th><th>入库数量/重量</th><th>已售数量/重量</th><th>剩余库存</th><th>销售金额</th><th>状态</th><th>操作</th></tr></thead><tbody>'+
      showRows.map(function(r){
        return '<tr onclick="inventoryStep1Select(\'goods\',\''+e(r.goodsId)+'\',\''+e(r.goodsName)+'\')"><td>'+e(r.owner)+'</td><td><b>'+e(r.batchNo)+'</b><span>'+e(r.batchType)+'</span></td><td><b class="inventory-step1-green">'+e(r.goodsName)+'</b><span>'+e(r.pack)+'</span></td><td>'+amountText(r.inQty,r.inWeight,r.unit)+'</td><td>'+amountText(r.soldQty,r.soldWeight,r.unit)+'</td><td>'+amountText(r.remainQty,r.remainWeight,r.unit)+'</td><td>'+m(r.saleAmount)+'</td><td><em class="'+((r.settled || r.soldOut) ? "settled" : r.saleStopped ? "stopped" : "")+'">'+stateText(r)+'</em></td><td>'+inventoryGoodsSaleButtonStep1(r)+'</td></tr>';
      }).join("") + '</tbody></table>' : '<div class="inventory-step1-empty">暂无已确认入库库存。<br>新建批次后，必须点击“确认入库”才会进入库存和收银台。</div>';
    var orderLines = [];
    showRows.forEach(function(r){
      (r.orders || []).forEach(function(o){
        orderLines.push('<tr><td>销售出库</td><td>'+e(o.time)+'</td><td>'+e(r.owner)+'</td><td>'+e(r.batchNo)+'</td><td>'+e(r.goodsName)+'</td><td>'+e(o.buyer)+'</td><td>'+e(o.orderNo)+'</td><td>-'+n(o.qty)+e(r.unit)+'</td><td>-'+n(o.weight)+'斤</td><td>'+m(o.amount)+'</td></tr>');
      });
    });
    document.getElementById("inventoryStep1Ledger").innerHTML = '<table class="inventory-step1-table"><thead><tr><th>类型</th><th>时间</th><th>货主</th><th>批次</th><th>商品</th><th>买家</th><th>订单</th><th>数量</th><th>重量</th><th>金额</th></tr></thead><tbody>'+
      (orderLines.join("") || '<tr><td colspan="10">暂无销售出库记录。</td></tr>') + '</tbody></table>';
  }
  window.inventoryStep1Select = function(type, value, title){
    inventoryStep1Filter = {type:type, value:value, title:title};
    renderInventoryStep1();
  };
  window.toggleInventoryGoodsSaleStep1 = function(batchId, goodsId, goodsName){
    var batch = batchByIdStep1(batchId);
    var item = itemByGoodsStep1(batch, goodsId, goodsName);
    if(!batch || !item) return;
    if(batchSoldOutStep1(batch) || batchSettledStep1(batch)){
      alert("该批次已售完，不能单独开售货品。");
      return;
    }
    if(itemSaleStoppedStep1(item)){
      item.saleStopped = false;
      item.salePaused = false;
      item.saleStatus = "selling";
      if(typeof toast === "function") toast("货品已开售，收银台恢复显示");
    }else{
      item.saleStopped = true;
      item.saleStatus = "stopped";
      if(typeof toast === "function") toast("货品已停售，收银台不再显示");
    }
    refreshInventorySaleStep1();
    try{ if(typeof renderStockModule === "function") renderStockModule(); }catch(err){}
    try{ if(typeof renderDetail === "function") renderDetail(); }catch(err){}
  };
  function renderInventoryBatchOpsStep1(){
    var actions = document.querySelector("#inventoryStep1Root .inventory-step1-actions");
    if(!actions) return;
    actions.querySelectorAll(".inventory-step1-batch-op").forEach(function(el){ el.remove(); });
    if(inventoryStep1Filter.type !== "batch") return;
    var b = batchByIdStep1(inventoryStep1Filter.value);
    if(!b) return;
    var soldOut = document.createElement("button");
    soldOut.type = "button";
    soldOut.className = "inventory-step1-batch-op " + (batchSoldOutStep1(b) ? "inventory-step1-gray" : "inventory-step1-orangebtn");
    soldOut.textContent = batchSoldOutStep1(b) ? "取消售完" : "售完";
    soldOut.onclick = function(){
      markInventoryBatchSoldOutStep1(b.id);
    };
    actions.appendChild(soldOut);
  };
  window.toggleInventoryBatchSaleStep1 = function(batchId){
    var b = batchByIdStep1(batchId);
    if(!b) return;
    if(batchSaleStoppedStep1(b)){
      b.saleStopped = false;
      b.saleStatus = "selling";
      b.soldOut = false;
      b.soldOutAt = "";
      if(typeof toast === "function") toast("批次已开售，收银台恢复显示");
    }else{
      if(!confirm("确认停售该批次？停售后该批次商品不会再出现在收银台。")) return;
      b.saleStopped = true;
      b.saleStatus = "stopped";
      b.soldOut = false;
      if(typeof toast === "function") toast("批次已停售，收银台不再显示");
    }
    refreshInventorySaleStep1();
  };
  window.markInventoryBatchSoldOutStep1 = function(batchId){
    var b = batchByIdStep1(batchId);
    if(!b) return;
    if(batchSoldOutStep1(b)){
      if(!confirm("确认取消该批次售完状态？取消后该批次商品会重新进入收银台。")) return;
      b.saleStopped = false;
      b.soldOut = false;
      b.saleStatus = "selling";
      b.soldOutAt = "";
      if(typeof toast === "function") toast("已取消售完，批次恢复开售");
      refreshInventorySaleStep1();
      return;
    }
    if(!confirm("确认将该批次标记为售完？售完后该批次商品不会再出现在收银台。")) return;
    b.saleStopped = true;
    b.soldOut = true;
    b.saleStatus = "soldout";
    b.soldOutAt = new Date().toLocaleString("zh-CN", {hour12:false});
    if(typeof toast === "function") toast("批次已售完，收银台不再显示");
    refreshInventorySaleStep1();
  };
  function ensureInventoryStep1Dom(){
    if(document.getElementById("inventoryStep1Root")) return;
    var style = document.createElement("style");
    style.textContent = `
      #inventoryStep1Root{display:none;margin-left:74px;width:calc(100vw - 74px);min-height:100vh;background:#f4f5f1;color:#1f2a22;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",Arial,sans-serif}
      .inventory-step1-layout{display:grid;grid-template-columns:300px minmax(0,1fr);min-height:100vh}
      .inventory-step1-tree{background:#f7f8f4;border-right:1px solid #d9ddd3;padding:14px;overflow:auto}
      .inventory-step1-tree h1{font-size:24px;margin:0 0 12px;font-weight:950}
      .inventory-step1-node{border:2px solid #d9ddd3;background:#fff;border-radius:14px;padding:12px;margin-bottom:10px;cursor:pointer}
      .inventory-step1-node.batch{margin-left:16px}
      .inventory-step1-node.active{border-color:#2f8e40;background:#eef8ea}
      .inventory-step1-node b{display:block;font-size:17px;margin-bottom:5px}
      .inventory-step1-node span{display:block;font-size:12px;color:#647064;font-weight:800}
      .inventory-step1-main{background:#fff;min-width:0;overflow:auto}
      .inventory-step1-top{min-height:82px;border-bottom:1px solid #d9ddd3;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;gap:12px}
      .inventory-step1-top h2{margin:0;font-size:26px;font-weight:950}
      .inventory-step1-top p{margin:5px 0 0;color:#667068;font-size:13px;font-weight:800}
      .inventory-step1-actions{display:flex;gap:10px;flex-wrap:wrap}
      .inventory-step1-actions input{height:40px;width:280px;border:1px solid #cfd6cb;border-radius:10px;padding:0 10px;font-weight:800}
      .inventory-step1-actions button{height:40px;border:0;border-radius:10px;padding:0 14px;font-weight:950;cursor:pointer}
      .inventory-step1-gray{background:#e5e8e0;color:#263028}.inventory-step1-greenbtn{background:#2f8e40;color:#fff}
      .inventory-cloud-status{flex-basis:100%;color:#687268;font-size:12px;font-weight:900;text-align:right}
      .inventory-step1-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;padding:14px 18px;background:#fbfcf8;border-bottom:1px solid #e5e8df}
      .inventory-step1-card{border:1px solid #d9ddd3;border-radius:14px;background:#fff;padding:12px}.inventory-step1-card span{display:block;color:#687268;font-size:12px;font-weight:900}.inventory-step1-card b{font-size:20px;font-weight:950}
      .inventory-step1-section{padding:14px 18px}.inventory-step1-section h3{margin:0 0 10px;font-size:20px;font-weight:950}
      .inventory-step1-table{width:100%;min-width:980px;border-collapse:collapse;border:1px solid #d9ddd3;border-radius:14px;overflow:hidden}
      .inventory-step1-table th,.inventory-step1-table td{border-bottom:1px solid #e5e8df;padding:10px 9px;text-align:left;font-size:14px;font-weight:800;vertical-align:middle}
      .inventory-step1-table th{background:#eef1ed;font-weight:950}.inventory-step1-table tr:nth-child(even) td{background:#f8f9f5}.inventory-step1-table span,.inventory-step1-sub{display:block;color:#607066;font-size:12px;font-weight:800;margin-top:3px}
      .inventory-step1-table em{display:inline-flex;background:#e9f8ee;color:#23733b;border-radius:999px;padding:4px 8px;font-style:normal;font-size:12px;font-weight:950}.inventory-step1-green{color:#168442}.inventory-step1-empty{min-height:180px;display:flex;align-items:center;justify-content:center;text-align:center;color:#6c756b;font-weight:900;line-height:1.8}
      @media(max-width:980px){#inventoryStep1Root{margin-left:0;margin-top:58px;width:100vw}.inventory-step1-layout{grid-template-columns:1fr}.inventory-step1-summary{grid-template-columns:1fr 1fr}.inventory-step1-top{display:block}.inventory-step1-actions{margin-top:10px}.inventory-step1-actions input{width:100%}}
    `;
    document.head.appendChild(style);
    var root = document.createElement("div");
    root.id = "inventoryStep1Root";
    root.innerHTML = '<div class="inventory-step1-layout"><aside class="inventory-step1-tree"><h1>库存</h1><div id="inventoryStep1Tree"></div></aside><main class="inventory-step1-main"><header class="inventory-step1-top"><div><h2 id="inventoryStep1Title">全部批次</h2><p id="inventoryStep1Sub"></p></div><div class="inventory-step1-actions"><input id="inventoryStep1Search" placeholder="搜索货主 / 批次 / 商品..." oninput="renderInventoryStep1()"><button class="inventory-step1-gray" onclick="showAppPage(\'stock\')">查看批次</button><button class="inventory-step1-greenbtn" onclick="renderInventoryStep1()">刷新库存</button></div></header><section class="inventory-step1-summary" id="inventoryStep1Summary"></section><section class="inventory-step1-section"><h3>库存明细</h3><div id="inventoryStep1Table"></div></section><section class="inventory-step1-section"><h3>销售流水</h3><div id="inventoryStep1Ledger"></div></section></main></div>';
    document.body.appendChild(root);
  }
  window.renderInventoryStep1 = renderInventoryStep1;
  function rebuildNavStep1(active){
    var nav = document.getElementById("globalUnifiedNavV41");
    if(!nav) return;
    function cls(p){ return active === p ? " active" : ""; }
    nav.innerHTML = '<div class="v41-logo">仓頡</div>'
      + '<button class="v41-nav-btn'+cls("cashier")+'" data-page="cashier">收银</button>'
      + '<button class="v41-nav-btn'+cls("stock")+'" data-page="stock">批次</button>'
      + '<button class="v41-nav-btn'+cls("inventoryStep1")+'" data-page="inventoryStep1">库存</button>'
      + '<button class="v41-nav-btn'+cls("orders")+'" data-page="orders">订单</button>'
      + '<button class="v41-nav-btn'+cls("ownersStep1")+'" data-page="ownersStep1">货主</button>'
      + '<button class="v41-nav-btn" data-page="buyers">买家管理</button>'
      + '<button class="v41-nav-btn'+cls("reports")+'" data-page="reports">报表</button>'
      + '<button class="v41-nav-btn'+cls("configStep1")+'" data-config-direct="1">配置</button>'
      + '<button class="v41-nav-btn'+cls("profileV92")+'" data-page="profileV92">个人中心</button>';
  }
  function scheduleNavStep1(active){
    rebuildNavStep1(active);
    setTimeout(function(){ rebuildNavStep1(active); }, 60);
    setTimeout(function(){ rebuildNavStep1(active); }, 260);
  }
  function showOnlyStep1(page){
    ensureInventoryStep1Dom();
    ["cashierRoot","inboundRoot","stockRoot","ordersRoot","inventoryStep1Root","ownerStep1Root"].forEach(function(id){
      var el = document.getElementById(id);
      if(el) el.style.setProperty("display", "none", "important");
    });
    document.body.classList.remove("show-cashier","show-inbound","show-stock","show-orders","inventory-mode","batch-create-mode","batch-overview-mode");
    if(page === "inventoryStep1"){
      document.getElementById("inventoryStep1Root").style.setProperty("display", "block", "important");
      scheduleNavStep1("inventoryStep1");
      renderInventoryStep1();
      return true;
    }
    return false;
  }
  window.showAppPage = function(page){
    if(page === "inventoryStep1" || page === "inventory"){
      showOnlyStep1("inventoryStep1");
      return;
    }
    var root = document.getElementById("inventoryStep1Root");
    if(root) root.style.setProperty("display", "none", "important");
    var ownerRoot = document.getElementById("ownerStep1Root");
    if(ownerRoot) ownerRoot.style.setProperty("display", "none", "important");
    ["cashierRoot","inboundRoot","stockRoot","ordersRoot"].forEach(function(id){
      var el = document.getElementById(id);
      if(el) el.style.removeProperty("display");
    });
    if(typeof oldShowAppPageStep1 === "function") oldShowAppPageStep1(page);
    scheduleNavStep1(page === "ownersStep1" ? "ownersStep1" : page === "stock" ? "stock" : page === "orders" ? "orders" : page === "inbound" ? "stock" : "cashier");
  };
  function installNavStep1(){
    ensureInventoryStep1Dom();
    scheduleNavStep1(document.getElementById("ownerStep1Root")?.style.display === "block" ? "ownersStep1" : document.body.classList.contains("show-stock") ? "stock" : document.body.classList.contains("show-orders") ? "orders" : "cashier");
    var nav = document.getElementById("globalUnifiedNavV41");
    if(nav && !nav.__inventoryStep1Click){
      nav.__inventoryStep1Click = true;
      nav.addEventListener("click", function(ev){
        var btn = ev.target && ev.target.closest ? ev.target.closest("[data-page]") : null;
        if(!btn) return;
        ev.preventDefault();
        ev.stopPropagation();
        if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
        showAppPage(btn.getAttribute("data-page"));
      }, true);
    }
  }
  ["confirmInbound","confirmOrderFromCodeBill","completeSettleOrder"].forEach(function(name){
    var fn = window[name];
    if(typeof fn === "function" && !fn.__inventoryStep1Wrap){
      window[name] = function(){
        var result = fn.apply(this, arguments);
        setTimeout(function(){
          if(document.getElementById("inventoryStep1Root")?.style.display === "block") renderInventoryStep1();
        }, 80);
        return result;
      };
      window[name].__inventoryStep1Wrap = true;
    }
  });
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", installNavStep1);
  }else{
    installNavStep1();
  }
  setTimeout(installNavStep1, 300);
  setTimeout(installNavStep1, 1000);
})();

/* extracted script block 20 */
/* ===== Step1 修复：修改批次使用独立干净弹窗，不显示新增货主入口 ===== */
(function(){
  var editBatchStep1Id = "";

  function escStep1(v){
    return typeof esc === "function" ? esc(v) : String(v ?? "");
  }

  function currentBatchForEditStep1(){
    if(typeof selectedStockBatchId !== "undefined" && selectedStockBatchId && selectedStockBatchId !== "all" && Array.isArray(batches)){
      var byStock = batches.find(function(b){ return b.id === selectedStockBatchId; });
      if(byStock) return byStock;
    }
    if(typeof activeBatchId !== "undefined" && activeBatchId && Array.isArray(batches)){
      var byActive = batches.find(function(b){ return b.id === activeBatchId; });
      if(byActive) return byActive;
    }
    if(typeof activeBatch === "function"){
      var ab = activeBatch();
      if(ab) return ab;
    }
    if(Array.isArray(batches) && batches.length) return batches[0];
    return null;
  }

  function ensureEditBatchStep1Dom(){
    if(document.getElementById("editBatchStep1Mask")) return;
    var style = document.createElement("style");
    style.textContent = `
      #editBatchStep1Mask{position:fixed;inset:0;background:rgba(12,18,14,.48);display:none;align-items:center;justify-content:center;z-index:10020;padding:18px}
      #editBatchStep1Mask.show{display:flex}
      .edit-batch-step1-modal{width:min(520px,94vw);background:#fff;border-radius:18px;box-shadow:0 24px 70px rgba(0,0,0,.24);overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",Arial,sans-serif}
      .edit-batch-step1-head{height:64px;padding:0 20px;border-bottom:1px solid #e5e8df;display:flex;align-items:center;justify-content:space-between}
      .edit-batch-step1-head h2{margin:0;font-size:22px;font-weight:950;color:#1f2a22}
      .edit-batch-step1-close{width:38px;height:38px;border:0;border-radius:10px;background:#e5e8e0;color:#263028;font-size:20px;font-weight:950;cursor:pointer}
      .edit-batch-step1-body{padding:18px 20px 20px;display:grid;gap:12px}
      .edit-batch-step1-body label{font-size:14px;font-weight:950;color:#354139}
      .edit-batch-step1-body input,.edit-batch-step1-body select,.edit-batch-step1-body textarea{width:100%;box-sizing:border-box;min-height:44px;border:1px solid #d3d8cf;border-radius:12px;padding:0 12px;font-size:15px;font-weight:800;background:#fff}
      .edit-batch-step1-body textarea{min-height:86px;padding:10px 12px;resize:vertical}
      .edit-batch-step1-actions{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:6px}
      .edit-batch-step1-actions button{height:46px;border:0;border-radius:12px;font-size:16px;font-weight:950;cursor:pointer}
      .edit-batch-step1-cancel{background:#e5e8e0;color:#263028}
      .edit-batch-step1-save{background:#2f8e40;color:#fff}
    `;
    document.head.appendChild(style);

    var mask = document.createElement("div");
    mask.id = "editBatchStep1Mask";
    mask.innerHTML = ''
      + '<div class="edit-batch-step1-modal">'
      + '  <div class="edit-batch-step1-head"><h2>修改批次</h2><button class="edit-batch-step1-close" type="button" onclick="closeEditBatchStep1()">×</button></div>'
      + '  <div class="edit-batch-step1-body">'
      + '    <label>货主</label>'
      + '    <input id="editBatchStep1Owner" placeholder="请输入货主名称">'
      + '    <label>批次号</label>'
      + '    <input id="editBatchStep1No" placeholder="请输入批次号">'
      + '    <label>批次类型</label>'
      + '    <select id="editBatchStep1Tag"><option value="自营">自营</option><option value="代卖">代卖</option></select>'
      + '    <label>批次说明 / 车牌号</label>'
      + '    <textarea id="editBatchStep1Remark" placeholder="可填写批次说明或车牌号"></textarea>'
      + '    <div class="edit-batch-step1-actions"><button class="edit-batch-step1-cancel" type="button" onclick="closeEditBatchStep1()">取消</button><button class="edit-batch-step1-save" type="button" onclick="saveEditBatchStep1()">保存修改</button></div>'
      + '  </div>'
      + '</div>';
    document.body.appendChild(mask);
  }

  window.openEditBatchStep1 = function(){
    ensureEditBatchStep1Dom();
    var b = currentBatchForEditStep1();
    if(!b){
      alert("请先选择一个批次。");
      return;
    }
    editBatchStep1Id = b.id || "";
    document.getElementById("editBatchStep1Owner").value = b.owner || "";
    document.getElementById("editBatchStep1No").value = b.no || b.batchNo || "";
    document.getElementById("editBatchStep1Tag").value = b.tag || b.type || "自营";
    document.getElementById("editBatchStep1Remark").value = b.remark || b.note || "";
    document.getElementById("editBatchStep1Mask").classList.add("show");
  };

  window.closeEditBatchStep1 = function(){
    var mask = document.getElementById("editBatchStep1Mask");
    if(mask) mask.classList.remove("show");
  };

  window.saveEditBatchStep1 = function(){
    var b = null;
    if(Array.isArray(batches)){
      if(editBatchStep1Id) b = batches.find(function(x){ return x.id === editBatchStep1Id; });
      if(!b) b = currentBatchForEditStep1();
    }
    if(!b){
      alert("没有找到当前批次。");
      return;
    }

    var owner = (document.getElementById("editBatchStep1Owner").value || "").trim();
    var no = (document.getElementById("editBatchStep1No").value || "").trim();
    var tag = document.getElementById("editBatchStep1Tag").value || "自营";
    var remark = document.getElementById("editBatchStep1Remark").value || "";

    if(!owner){
      alert("请填写货主。");
      return;
    }
    if(!no){
      alert("请填写批次号。");
      return;
    }

    b.owner = owner;
    b.no = no;
    b.batchNo = no;
    b.tag = tag;
    b.type = tag;
    b.remark = remark;
    b.note = remark;
    if(Array.isArray(owners) && owner && !owners.includes(owner)) owners.push(owner);

    closeEditBatchStep1();
    try{ if(typeof renderAll === "function") renderAll(); }catch(err){}
    try{ if(typeof renderStockModule === "function") renderStockModule(); }catch(err){}
    try{ if(typeof renderInventoryStep1 === "function") renderInventoryStep1(); }catch(err){}
    try{ if(typeof renderCashierBatches === "function") renderCashierBatches(); }catch(err){}
    try{ if(typeof renderCashierProducts === "function") renderCashierProducts(); }catch(err){}
    try{ if(typeof tudou2SaveNow === "function") setTimeout(tudou2SaveNow, 0); }catch(err){}
    if(typeof toast === "function") toast("批次已修改");
  };

  function bindEditBatchButtonsStep1(){
    ensureEditBatchStep1Dom();
    Array.from(document.querySelectorAll("button")).forEach(function(btn){
      if((btn.textContent || "").trim() === "修改批次"){
        btn.onclick = function(ev){
          if(ev){
            ev.preventDefault();
            ev.stopPropagation();
          }
          openEditBatchStep1();
          return false;
        };
      }
    });
  }

  document.addEventListener("click", function(ev){
    var btn = ev.target && ev.target.closest ? ev.target.closest("button") : null;
    if(btn && (btn.textContent || "").trim() === "修改批次"){
      ev.preventDefault();
      ev.stopPropagation();
      if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      openEditBatchStep1();
    }
  }, true);

  setTimeout(bindEditBatchButtonsStep1, 0);
  setTimeout(bindEditBatchButtonsStep1, 300);
  setTimeout(bindEditBatchButtonsStep1, 1000);
})();

/* extracted script block 21 */
/* ===== Step1 修正：修改批次 = 回到当前批次的完整入库明细编辑界面 ===== */
(function(){
  function selectedBatchForFullEditStep1(){
    if(typeof batches === "undefined" || !Array.isArray(batches) || !batches.length) return null;

    if(typeof selectedStockBatchId !== "undefined" && selectedStockBatchId && selectedStockBatchId !== "all"){
      var byStock = batches.find(function(b){ return b.id === selectedStockBatchId; });
      if(byStock) return byStock;
    }

    var activeCard = document.querySelector(".stock-batch-card.active, .batch-card.active, .cashier-batch-card.active");
    if(activeCard){
      var txt = activeCard.innerText || "";
      var byCard = batches.find(function(b){
        return txt.includes(String(b.owner || "")) && txt.includes(String(b.no || b.batchNo || ""));
      });
      if(byCard) return byCard;
    }

    if(typeof activeBatchId !== "undefined" && activeBatchId){
      var byActive = batches.find(function(b){ return b.id === activeBatchId; });
      if(byActive) return byActive;
    }

    if(typeof activeBatch === "function"){
      var ab = activeBatch();
      if(ab) return ab;
    }

    return batches[0];
  }

  function lockNavForFullEditStep1(){
    var nav = document.getElementById("globalUnifiedNavV41");
    if(!nav) return;
    nav.innerHTML = '<div class="v41-logo">仓頡</div>'
      + '<button class="v41-nav-btn" data-page="cashier">收银</button>'
      + '<button class="v41-nav-btn active" data-page="stock">批次</button>'
      + '<button class="v41-nav-btn" data-page="inventoryStep1">库存</button>'
      + '<button class="v41-nav-btn" data-page="orders">订单</button>'
      + '<button class="v41-nav-btn" data-page="ownersStep1">货主</button>'
      + '<button class="v41-nav-btn" data-page="buyers">买家管理</button>'
      + '<button class="v41-nav-btn" data-page="reports">报表</button>'
      + '<button class="v41-nav-btn" data-config-direct="1">配置</button>'
      + '<button class="v41-nav-btn" data-page="profileV92">个人中心</button>';
  }

  window.openFullBatchEditStep1 = function(){
    var b = selectedBatchForFullEditStep1();
    if(!b){
      alert("请先选择一个批次。");
      return;
    }

    if(typeof activeBatchId !== "undefined"){
      activeBatchId = b.id;
    }
    if(typeof selectedStockBatchId !== "undefined"){
      selectedStockBatchId = b.id;
    }

    ["editBatchStep1Mask","v53BatchEditMask","v52BatchEditMask","v51BatchEditMask","batchModal"].forEach(function(id){
      var el = document.getElementById(id);
      if(el) el.classList.remove("show");
    });

    ["cashierRoot","stockRoot","ordersRoot","inventoryStep1Root"].forEach(function(id){
      var el = document.getElementById(id);
      if(el) el.style.setProperty("display", "none", "important");
    });

    var inboundRoot = document.getElementById("inboundRoot");
    if(inboundRoot) inboundRoot.style.setProperty("display", "block", "important");

    var inventoryView = document.getElementById("inventoryView");
    if(inventoryView) inventoryView.style.setProperty("display", "none", "important");

    document.body.classList.remove("show-cashier","show-stock","show-orders","inventory-mode","batch-overview-mode");
    document.body.classList.add("show-inbound","batch-create-mode");

    try{ if(typeof renderAll === "function") renderAll(); }catch(err){}
    try{ if(typeof renderDetail === "function") renderDetail(); }catch(err){}
    try{ if(typeof renderGoods === "function") renderGoods(); }catch(err){}
    try{ if(typeof renderBatches === "function") renderBatches(); }catch(err){}
    lockNavForFullEditStep1();

    setTimeout(function(){
      lockNavForFullEditStep1();
      document.querySelectorAll("#inboundRoot .back").forEach(function(el){
        el.textContent = "← 返回批次";
        el.onclick = function(){
          if(typeof closeBatchCreateFlowToOverview === "function") closeBatchCreateFlowToOverview();
          else if(typeof showAppPage === "function") showAppPage("stock");
        };
      });
      var detail = document.getElementById("detailBody") || document.querySelector(".right-panel");
      if(detail && detail.scrollIntoView) detail.scrollIntoView({behavior:"smooth", block:"center"});
    }, 80);

    if(typeof toast === "function") toast("已进入当前批次明细修改");
  };

  // 覆盖上一轮“只改批次基础信息”的入口，避免再次弹出基础信息弹窗。
  window.openEditBatchStep1 = window.openFullBatchEditStep1;

  function bindFullBatchEditButtonsStep1(){
    Array.from(document.querySelectorAll("button")).forEach(function(btn){
      if((btn.textContent || "").trim() === "修改批次"){
        btn.onclick = function(ev){
          if(ev){
            ev.preventDefault();
            ev.stopPropagation();
            if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
          }
          openFullBatchEditStep1();
          return false;
        };
      }
    });
  }

  document.addEventListener("click", function(ev){
    var btn = ev.target && ev.target.closest ? ev.target.closest("button") : null;
    if(btn && (btn.textContent || "").trim() === "修改批次"){
      ev.preventDefault();
      ev.stopPropagation();
      if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      openFullBatchEditStep1();
      return false;
    }
  }, true);

  setTimeout(bindFullBatchEditButtonsStep1, 0);
  setTimeout(bindFullBatchEditButtonsStep1, 300);
  setTimeout(bindFullBatchEditButtonsStep1, 1000);
  document.addEventListener("click", function(){
    setTimeout(bindFullBatchEditButtonsStep1, 30);
  });
  setTimeout(function(){ window.openEditBatchStep1 = window.openFullBatchEditStep1; }, 0);
  setTimeout(function(){ window.openEditBatchStep1 = window.openFullBatchEditStep1; }, 300);
})();

/* extracted script block 22 */
/* ===== Step1 UI polish: stabilize global left nav, stop Inventory flashing on Batch click ===== */
(function(){
  function navHtml(active){
    function cls(page){ return active === page ? " active" : ""; }
    return '<div class="v41-logo">仓頡</div>'
      + '<button class="v41-nav-btn'+cls("cashier")+'" data-page="cashier">收银</button>'
      + '<button class="v41-nav-btn'+cls("stock")+'" data-page="stock">批次</button>'
      + '<button class="v41-nav-btn'+cls("inventoryStep1")+'" data-page="inventoryStep1">库存</button>'
      + '<button class="v41-nav-btn'+cls("orders")+'" data-page="orders">订单</button>'
      + '<button class="v41-nav-btn'+cls("ownersStep1")+'" data-page="ownersStep1">货主</button>'
      + '<button class="v41-nav-btn" data-page="buyers">买家管理</button>'
      + '<button class="v41-nav-btn'+cls("reports")+'" data-page="reports">报表</button>'
      + '<button class="v41-nav-btn'+cls("configStep1")+'" data-config-direct="1">配置</button>'
      + '<button class="v41-nav-btn'+cls("profileV92")+'" data-page="profileV92">个人中心</button>';
  }

  function normalizePage(page){
    if(page === "batch") return "stock";
    if(page === "inventory") return "inventoryStep1";
    if(page === "owner" || page === "owners") return "ownersStep1";
    if(page === "config" || page === "settings" || page === "connection") return "configStep1";
    if(page === "profile" || page === "personalCenter") return "profileV92";
    if(page === "inbound") return "stock";
    return page || "cashier";
  }

  function stableNav(active){
    var nav = document.getElementById("globalUnifiedNavV41");
    if(!nav) return;
    var expectedLabels = ["收银","批次","库存","订单","货主","买家管理","报表","配置","个人中心"];
    var labels = Array.from(nav.querySelectorAll(".v41-nav-btn")).map(function(btn){
      return (btn.textContent || "").trim();
    });
    var wrongText = expectedLabels.some(function(label, i){ return labels[i] !== label; });
    var activeBtn = nav.querySelector(".v41-nav-btn.active");
    var wrongActive = !activeBtn || activeBtn.getAttribute("data-page") !== active;
    if(wrongText || wrongActive || labels.length !== expectedLabels.length){
      nav.innerHTML = navHtml(active);
    }
  }

  function hideRoot(id){
    var el = document.getElementById(id);
    if(el) el.style.setProperty("display", "none", "important");
  }

  function showRoot(id){
    var el = document.getElementById(id);
    if(el) el.style.setProperty("display", "block", "important");
  }

  function setBodyMode(mode){
    document.body.classList.remove(
      "show-cashier",
      "show-inbound",
      "show-stock",
      "show-orders",
      "show-profile-v92",
      "inventory-mode",
      "batch-create-mode",
      "batch-overview-mode"
    );
    if(mode === "cashier") document.body.classList.add("show-cashier");
    if(mode === "stock") document.body.classList.add("show-stock","batch-overview-mode");
    if(mode === "orders") document.body.classList.add("show-orders");
    if(mode === "inventoryStep1") document.body.classList.add("inventory-mode");
  }

  function showStablePage(page){
    page = normalizePage(page);

    if(page === "buyers"){
      stableNav(currentStablePage());
      if(typeof openBuyerManagerV47 === "function") openBuyerManagerV47();
      return;
    }
    if(page === "reports"){
      if(typeof ensureReportsStep1Dom === "function") ensureReportsStep1Dom();
      ["cashierRoot","inboundRoot","stockRoot","ordersRoot","inventoryStep1Root","ownerStep1Root","configStep1Root","profileCenterRootV92","inventoryView"].forEach(hideRoot);
      showRoot("reportsStep1Root");
      setBodyMode("reports");
      stableNav("reports");
      try{ if(typeof renderReportsStep1 === "function") renderReportsStep1(); }catch(err){}
      return;
    }
    if(page === "configStep1"){
      if(typeof ensureConfigStep1Dom === "function") ensureConfigStep1Dom();
      ["cashierRoot","inboundRoot","stockRoot","ordersRoot","inventoryStep1Root","ownerStep1Root","reportsStep1Root","profileCenterRootV92","inventoryView"].forEach(hideRoot);
      showRoot("configStep1Root");
      setBodyMode("configStep1");
      stableNav("configStep1");
      try{ if(typeof renderConfigStep1 === "function") renderConfigStep1(); }catch(err){}
      return;
    }

    if(page === "profileV92"){
      if(typeof window.showProfileCenterV92 === "function"){
        window.showProfileCenterV92();
      }else{
        ["cashierRoot","inboundRoot","stockRoot","ordersRoot","inventoryStep1Root","ownerStep1Root","reportsStep1Root","configStep1Root","inventoryView"].forEach(hideRoot);
        showRoot("profileCenterRootV92");
        stableNav("profileV92");
      }
      return;
    }

    ["cashierRoot","inboundRoot","stockRoot","ordersRoot","inventoryStep1Root","ownerStep1Root","reportsStep1Root","configStep1Root","profileCenterRootV92","inventoryView"].forEach(hideRoot);

    if(page === "ownersStep1"){
      if(typeof ensureOwnerStep1Dom === "function") ensureOwnerStep1Dom();
      showRoot("ownerStep1Root");
      setBodyMode("ownersStep1");
      stableNav("ownersStep1");
      try{ if(typeof renderOwnerStep1 === "function") renderOwnerStep1(); }catch(err){}
      return;
    }

    if(page === "inventoryStep1"){
      if(typeof ensureInventoryStep1Dom === "function") ensureInventoryStep1Dom();
      showRoot("inventoryStep1Root");
      setBodyMode("inventoryStep1");
      stableNav("inventoryStep1");
      try{ if(typeof renderInventoryStep1 === "function") renderInventoryStep1(); }catch(err){}
      return;
    }

    if(page === "orders"){
      showRoot("ordersRoot");
      setBodyMode("orders");
      stableNav("orders");
      try{ if(typeof renderOrdersCenter === "function") renderOrdersCenter(); }catch(err){}
      return;
    }

    if(page === "stock"){
      showRoot("stockRoot");
      setBodyMode("stock");
      try{ if(typeof renderStockModule === "function") renderStockModule(); }catch(err){}
      try{ if(typeof v44PatchBatchOverview === "function") v44PatchBatchOverview(); }catch(err){}
      stableNav("stock");
      setTimeout(function(){ stableNav("stock"); }, 0);
      setTimeout(function(){ stableNav("stock"); }, 80);
      return;
    }

    showRoot("cashierRoot");
    setBodyMode("cashier");
    stableNav("cashier");
    try{ if(typeof renderCashierAll === "function") renderCashierAll(); }catch(err){}
    try{ if(typeof renderCashierBatches === "function") renderCashierBatches(); }catch(err){}
    try{ if(typeof renderCashierCatbar === "function") renderCashierCatbar(); }catch(err){}
    try{ if(typeof renderCashierProducts === "function") renderCashierProducts(); }catch(err){}
    try{ if(typeof renderCurrentCodeBill === "function") renderCurrentCodeBill(); }catch(err){}
  }

  function currentStablePage(){
    if(document.body.classList.contains("inventory-mode")) return "inventoryStep1";
    if(document.body.classList.contains("show-profile-v92")) return "profileV92";
    if(document.getElementById("ownerStep1Root")?.style.display === "block") return "ownersStep1";
    if(document.getElementById("configStep1Root")?.style.display === "block") return "configStep1";
    if(document.getElementById("reportsStep1Root")?.style.display === "block") return "reports";
    if(document.body.classList.contains("show-stock") || document.body.classList.contains("show-inbound")) return "stock";
    if(document.body.classList.contains("show-orders")) return "orders";
    return "cashier";
  }

  window.showAppPage = showStablePage;
  window.stableTudou2NavStep1 = stableNav;

  ["v38SyncNavActive","v40SyncNav","v41SetActive","v44SetGlobalActive"].forEach(function(name){
    if(typeof window[name] === "function"){
      window[name] = function(page){
        stableNav(normalizePage(page));
      };
    }
  });

  ["v42Patch批次Nav","v43PatchBatchNav"].forEach(function(name){
    if(typeof window[name] === "function"){
      window[name] = function(){
        stableNav(currentStablePage());
      };
    }
  });

  if(typeof window.v44PatchBatchOverview === "function"){
    var oldV44PatchBatchOverviewStep1 = window.v44PatchBatchOverview;
    window.v44PatchBatchOverview = function(){
      try{ oldV44PatchBatchOverviewStep1.apply(this, arguments); }catch(err){}
      stableNav(currentStablePage());
    };
  }

  document.addEventListener("click", function(ev){
    var btn = ev.target && ev.target.closest ? ev.target.closest("#globalUnifiedNavV41 [data-page]") : null;
    if(!btn) return;
    ev.preventDefault();
    ev.stopPropagation();
    if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    showStablePage(btn.getAttribute("data-page"));
    return false;
  }, true);

  document.addEventListener("pointerdown", function(ev){
    var btn = ev.target && ev.target.closest ? ev.target.closest("#globalUnifiedNavV41 [data-page]") : null;
    if(!btn) return;
    var page = normalizePage(btn.getAttribute("data-page"));
    if(page === "buyers" || page === "reports") return;
    stableNav(page);
  }, true);

  setTimeout(function(){ stableNav(currentStablePage()); }, 0);
  setTimeout(function(){ stableNav(currentStablePage()); }, 120);
  setTimeout(function(){ stableNav(currentStablePage()); }, 500);
})();

/* extracted script block 23 */
/* ===== Step1 data guard: cashier only sells confirmed inbound batches ===== */
(function(){
  function allBatches(){
    return (typeof batches !== "undefined" && Array.isArray(batches)) ? batches : [];
  }

  function isConfirmedBatch(b){
    return !!(b && b.confirmed === true);
  }

  function isSaleOpenBatch(b){
    return isConfirmedBatch(b) && !(b.saleStopped || b.salePaused || b.soldOut || b.settled || b.closed || b.ownerSettled || b.ownerSettlementAt || b.saleStatus === "stopped" || b.saleStatus === "soldout" || b.saleStatus === "settled");
  }

  function isSaleOpenItem(item, b){
    if(!isSaleOpenBatch(b)) return false;
    return !(item && (item.saleStopped || item.salePaused || item.settled || item.closed || item.saleStatus === "stopped" || item.saleStatus === "settled"));
  }

  function batchById(id){
    return allBatches().find(function(b){ return b && b.id === id; }) || null;
  }

  function confirmedBatchesOnly(){
    return allBatches().filter(isConfirmedBatch);
  }

  function saleOpenBatchesOnly(){
    return allBatches().filter(isSaleOpenBatch);
  }

  window.ensureBatchConfirmFlags = function(){
    allBatches().forEach(function(b){
      if(!b) return;
      if(b.confirmed === true) return;
      if(b.inboundConfirmedAt && b.confirmed !== false){
        b.confirmed = true;
      }else if(typeof b.confirmed === "undefined"){
        b.confirmed = false;
      }
    });
  };

  function markNewestActiveBatchDraft(beforeIds){
    try{
      var before = beforeIds || {};
      allBatches().forEach(function(b){
        if(b && !before[b.id] && b.confirmed !== true){
          b.confirmed = false;
          if(!b.inboundConfirmedAt) b.inboundConfirmedAt = "";
        }
      });
      if(typeof activeBatchId !== "undefined"){
        var active = batchById(activeBatchId);
        if(active && active.confirmed !== true && !active.inboundConfirmedAt) active.confirmed = false;
      }
    }catch(err){}
  }

  function idsBeforeCreate(){
    var map = {};
    allBatches().forEach(function(b){ if(b && b.id) map[b.id] = true; });
    return map;
  }

  ["saveBatchFromModal","saveBatch","addBatch","createBatch"].forEach(function(name){
    var oldFn = window[name];
    if(typeof oldFn !== "function" || oldFn.__confirmGuardWrapped) return;
    var wrapped = function(){
      var before = idsBeforeCreate();
      var result = oldFn.apply(this, arguments);
      markNewestActiveBatchDraft(before);
      try{ if(typeof tudou2SaveNow === "function") setTimeout(tudou2SaveNow, 0); }catch(err){}
      return result;
    };
    wrapped.__confirmGuardWrapped = true;
    window[name] = wrapped;
  });

  if(typeof window.confirmInbound === "function" && !window.confirmInbound.__confirmGuardWrapped){
    var oldConfirmInboundGuard = window.confirmInbound;
    window.confirmInbound = function(){
      var result;
      var b = null;
      try{ if(typeof activeBatch === "function") b = activeBatch(); }catch(err){}
      try{ if(!b && typeof activeBatchId !== "undefined") b = batchById(activeBatchId); }catch(err){}
      if(b){
        b.confirmed = true;
        b.inboundConfirmedAt = new Date().toLocaleString("zh-CN", {hour12:false});
      }
      result = oldConfirmInboundGuard.apply(this, arguments);
      if(b) b.confirmed = true;
      try{ if(typeof renderCashierBatches === "function") renderCashierBatches(); }catch(err){}
      try{ if(typeof renderCashierProducts === "function") renderCashierProducts(); }catch(err){}
      try{ if(typeof renderInventoryStep1 === "function") renderInventoryStep1(); }catch(err){}
      try{ if(typeof tudou2SaveNow === "function") setTimeout(tudou2SaveNow, 0); }catch(err){}
      return result;
    };
    window.confirmInbound.__confirmGuardWrapped = true;
  }

  window.getConfirmedBatches = confirmedBatchesOnly;
  window.stockConfirmedBatches = confirmedBatchesOnly;

  if(typeof window.getCashierProducts === "function" && !window.getCashierProducts.__confirmGuardWrapped){
    var oldGetCashierProductsGuard = window.getCashierProducts;
    window.getCashierProducts = function(skipLetterFilter){
      window.ensureBatchConfirmFlags();
      if(typeof cashierSelectedBatch !== "undefined"){
        var selected = batchById(cashierSelectedBatch);
        if(selected && !isConfirmedBatch(selected)) cashierSelectedBatch = "";
      }
      return oldGetCashierProductsGuard.call(this, skipLetterFilter).filter(function(g){
        if(!g || !g.batchId) return true;
        return isSaleOpenItem(g.relatedBatch, batchById(g.batchId));
      });
    };
    window.getCashierProducts.__confirmGuardWrapped = true;
  }

  if(typeof window.getProductBatchesForCashier === "function" && !window.getProductBatchesForCashier.__confirmGuardWrapped){
    var oldGetProductBatchesGuard = window.getProductBatchesForCashier;
    window.getProductBatchesForCashier = function(goodsId){
      window.ensureBatchConfirmFlags();
      return oldGetProductBatchesGuard.call(this, goodsId).filter(function(row){
        return row && isSaleOpenItem(row.relatedBatch || row.item, batchById(row.batchId));
      });
    };
    window.getProductBatchesForCashier.__confirmGuardWrapped = true;
  }

  if(typeof window.findFirstBatchForGoods === "function"){
    window.findFirstBatchForGoods = function(goodsId){
      window.ensureBatchConfirmFlags();
      for(var i = 0; i < saleOpenBatchesOnly().length; i++){
        var b = saleOpenBatchesOnly()[i];
        var item = (b.items || []).find(function(x){ return x.goodsId === goodsId && isSaleOpenItem(x, b); });
        if(item) return {batchNo:b.no || b.batchNo || "-", owner:b.owner || "-", batchId:b.id};
      }
      return {batchNo:"-", owner:"-", batchId:""};
    };
  }

  if(typeof window.addProductToCodeBill === "function" && !window.addProductToCodeBill.__confirmGuardWrapped){
    var oldAddProductToCodeBillGuard = window.addProductToCodeBill;
    window.addProductToCodeBill = function(goodsId, selectedBatchId){
      window.ensureBatchConfirmFlags();
      if(selectedBatchId){
        var b = batchById(selectedBatchId);
        var item = b ? (b.items || []).find(function(x){ return x.goodsId === goodsId; }) : null;
        if(!isConfirmedBatch(b)){
          if(typeof toast === "function") toast("该批次尚未确认入库，不能进入收银");
          return;
        }
        if(!isSaleOpenItem(item, b)){
          if(typeof toast === "function") toast("该商品或批次已停售/结算，不能进入收银");
          return;
        }
      }else{
        var ok = saleOpenBatchesOnly().some(function(b){
          return (b.items || []).some(function(item){ return item.goodsId === goodsId && isSaleOpenItem(item, b); });
        });
        if(!ok){
          if(typeof toast === "function") toast("该商品所在批次尚未确认入库，或已停售/结算");
          return;
        }
      }
      return oldAddProductToCodeBillGuard.apply(this, arguments);
    };
    window.addProductToCodeBill.__confirmGuardWrapped = true;
  }

  if(typeof window.renderCashierBatches === "function" && !window.renderCashierBatches.__confirmGuardWrapped){
    var oldRenderCashierBatchesGuard = window.renderCashierBatches;
    window.renderCashierBatches = function(){
      window.ensureBatchConfirmFlags();
      if(typeof cashierSelectedBatch !== "undefined"){
        var selected = batchById(cashierSelectedBatch);
        if(selected && !isConfirmedBatch(selected)) cashierSelectedBatch = "";
      }
      return oldRenderCashierBatchesGuard.apply(this, arguments);
    };
    window.renderCashierBatches.__confirmGuardWrapped = true;
  }

  window.ensureBatchConfirmFlags();
})();

/* extracted script block 24 */
/* ===== Step1 create flow fix: after choosing owner, enter goods selection for the new draft batch ===== */
(function(){
  function setCreateEditVisible(){
    ["cashierRoot","stockRoot","ordersRoot","inventoryStep1Root","ownerStep1Root","inventoryView"].forEach(function(id){
      var el = document.getElementById(id);
      if(el) el.style.setProperty("display", "none", "important");
    });
    var inbound = document.getElementById("inboundRoot");
    if(inbound) inbound.style.setProperty("display", "block", "important");

    document.body.classList.remove(
      "show-cashier",
      "show-stock",
      "show-orders",
      "inventory-mode",
      "batch-overview-mode"
    );
    document.body.classList.add("show-inbound","batch-create-mode");

    if(typeof batchCreateModeV44 !== "undefined") batchCreateModeV44 = true;
    try{ if(typeof stableTudou2NavStep1 === "function") stableTudou2NavStep1("stock"); }catch(err){}
  }

  function currentDraftBatch(){
    if(typeof batches === "undefined" || !Array.isArray(batches)) return null;
    if(typeof activeBatchId !== "undefined" && activeBatchId){
      var active = batches.find(function(b){ return b.id === activeBatchId; });
      if(active) return active;
    }
    return batches[0] || null;
  }

  window.openCurrentDraftBatchGoodsStep1 = function(){
    var b = currentDraftBatch();
    if(b && b.confirmed !== true){
      b.confirmed = false;
      if(!b.inboundConfirmedAt) b.inboundConfirmedAt = "";
    }
    setCreateEditVisible();
    try{ if(typeof renderAll === "function") renderAll(); }catch(err){}
    try{ if(typeof renderDetail === "function") renderDetail(); }catch(err){}
    try{ if(typeof renderGoods === "function") renderGoods(); }catch(err){}
    try{ if(typeof renderBatches === "function") renderBatches(); }catch(err){}
    try{ if(typeof v44PatchCreateFlowButtons === "function") v44PatchCreateFlowButtons(); }catch(err){}
    setTimeout(function(){
      setCreateEditVisible();
      try{ if(typeof renderGoods === "function") renderGoods(); }catch(err){}
      try{ if(typeof renderDetail === "function") renderDetail(); }catch(err){}
      document.querySelectorAll("#inboundRoot .back").forEach(function(el){
        el.textContent = "← 返回批次";
        el.onclick = function(){
          if(typeof closeBatchCreateFlowToOverview === "function") closeBatchCreateFlowToOverview();
          else if(typeof showAppPage === "function") showAppPage("stock");
        };
      });
    }, 60);
  };

  if(typeof window.openBatchCreateFlow === "function" && !window.openBatchCreateFlow.__step1CreateVisibleWrapped){
    var oldOpenBatchCreateFlowStep1 = window.openBatchCreateFlow;
    window.openBatchCreateFlow = function(){
      var result = oldOpenBatchCreateFlowStep1.apply(this, arguments);
      setTimeout(setCreateEditVisible, 20);
      setTimeout(setCreateEditVisible, 120);
      return result;
    };
    window.openBatchCreateFlow.__step1CreateVisibleWrapped = true;
  }

  if(typeof window.saveBatchFromModal === "function" && !window.saveBatchFromModal.__step1OpenGoodsWrapped){
    var oldSaveBatchFromModalStep1 = window.saveBatchFromModal;
    window.saveBatchFromModal = function(){
      var beforeId = typeof activeBatchId !== "undefined" ? activeBatchId : "";
      var result = oldSaveBatchFromModalStep1.apply(this, arguments);
      var after = currentDraftBatch();
      if(after && (!beforeId || after.id !== beforeId || after.confirmed !== true)){
        after.confirmed = false;
        if(!after.inboundConfirmedAt) after.inboundConfirmedAt = "";
      }
      setTimeout(window.openCurrentDraftBatchGoodsStep1, 0);
      setTimeout(window.openCurrentDraftBatchGoodsStep1, 90);
      return result;
    };
    window.saveBatchFromModal.__step1OpenGoodsWrapped = true;
  }
})();

/* extracted script block 25 */
/* ===== Step1 create-batch polish: category click jumps to goods and return button works ===== */
(function(){
  var activeCreateCatStep1 = "全";

  function firstGoodsCharStep1(name){
    var s = String(name || "").trim();
    return s ? s.charAt(0) : "";
  }

  function goodsForCreateCatStep1(){
    var qEl = document.getElementById("goodsSearch");
    var q = ((qEl && qEl.value) || "").trim().toLowerCase();
    var goods = (typeof goodsMaster !== "undefined" && Array.isArray(goodsMaster)) ? goodsMaster : [];
    return goods.filter(function(g){
      if(activeCreateCatStep1 && activeCreateCatStep1 !== "全" && firstGoodsCharStep1(g.name) !== activeCreateCatStep1) return false;
      if(!q) return true;
      return [g.name,g.category,g.pack].join(" ").toLowerCase().includes(q);
    });
  }

  function safeActiveBatchStep1(){
    try{ if(typeof activeBatch === "function") return activeBatch(); }catch(err){}
    try{
      if(typeof batches !== "undefined" && Array.isArray(batches)){
        if(typeof activeBatchId !== "undefined" && activeBatchId){
          return batches.find(function(b){ return b.id === activeBatchId; }) || batches[0];
        }
        return batches[0];
      }
    }catch(err){}
    return null;
  }

  window.renderCat = function(){
    var panel = document.getElementById("catPanel");
    if(!panel) return;
    var source = ["全"];
    try{
      var seen = {};
      ((typeof goodsMaster !== "undefined" && Array.isArray(goodsMaster)) ? goodsMaster : []).forEach(function(g){
        var ch = firstGoodsCharStep1(g.name);
        if(ch && !seen[ch]){
          seen[ch] = true;
          source.push(ch);
        }
      });
    }catch(err){}
    panel.innerHTML = source.map(function(c){
      var label = String(c || "全");
      return '<button type="button" class="cat '+(label === activeCreateCatStep1 ? 'active' : '')+'" data-create-cat="'+(typeof esc === "function" ? esc(label) : label)+'">'+(typeof esc === "function" ? esc(label) : label)+'</button>';
    }).join("");
  };

  window.renderGoods = function(){
    var grid = document.getElementById("goodsGrid");
    if(!grid) return;
    var batch = safeActiveBatchStep1();
    var list = goodsForCreateCatStep1();
    grid.innerHTML = list.map(function(g){
      var selected = !!(batch && Array.isArray(batch.items) && batch.items.some(function(i){ return i.goodsId === g.id; }));
      var packInfo = (g.pack === "定装" && g.spec)
        ? " ｜ " + (typeof esc === "function" ? esc(g.spec) : g.spec) + "斤/" + (typeof esc === "function" ? esc(g.unit || "件") : (g.unit || "件")) + (Number(g.price || 0) > 0 ? " ｜ 销售价" + (typeof money === "function" ? money(g.price || 0) : Number(g.price || 0).toFixed(2)) : " ｜ 开单填售价")
        : "";
      return '<div class="goods-card '+(selected ? 'selected' : '')+'" data-goods-id="'+g.id+'">'
        + '<div class="tick"></div>'
        + '<div class="name">'+(typeof esc === "function" ? esc(g.name) : g.name)+'</div>'
        + '<div class="type">'+(typeof esc === "function" ? esc(g.pack || "未设包装") : (g.pack || "未设包装"))+packInfo+'</div>'
        + '</div>';
    }).join("") || '<div class="hint">暂无匹配货品</div>';
  };

  window.selectCreateGoodsCatStep1 = function(cat){
    activeCreateCatStep1 = cat || "全";
    window.renderCat();
    window.renderGoods();
    var grid = document.getElementById("goodsGrid");
    if(grid) grid.scrollTo({top:0, behavior:"smooth"});
    var first = grid && grid.querySelector(".goods-card");
    if(first && first.scrollIntoView) first.scrollIntoView({block:"nearest", behavior:"smooth"});
  };

  function bindCreateCatAndBackStep1(){
    document.querySelectorAll("#inboundRoot #catPanel .cat").forEach(function(btn){
      btn.onclick = function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        window.selectCreateGoodsCatStep1(btn.getAttribute("data-create-cat") || btn.textContent.trim() || "全");
        return false;
      };
    });

    document.querySelectorAll("#inboundRoot .back, #inboundRoot button").forEach(function(el){
      var txt = (el.textContent || "").trim();
      if(txt === "← 返回批次" || txt === "返回批次" || txt === "← 返回"){
        el.textContent = txt === "返回批次" ? "返回批次" : "← 返回批次";
        el.onclick = function(ev){
          if(ev){
            ev.preventDefault();
            ev.stopPropagation();
          }
          returnToBatchOverviewStep1();
          return false;
        };
      }
    });
  }

  function returnToBatchOverviewStep1(){
    try{ if(typeof batchCreateModeV44 !== "undefined") batchCreateModeV44 = false; }catch(err){}
    ["cashierRoot","inboundRoot","ordersRoot","inventoryStep1Root","inventoryView"].forEach(function(id){
      var el = document.getElementById(id);
      if(el) el.style.setProperty("display","none","important");
    });
    var stock = document.getElementById("stockRoot");
    if(stock) stock.style.setProperty("display","block","important");
    document.body.classList.remove("show-cashier","show-inbound","show-orders","inventory-mode","batch-create-mode");
    document.body.classList.add("show-stock","batch-overview-mode");
    try{ if(typeof renderStockModule === "function") renderStockModule(); }catch(err){}
    try{ if(typeof v44PatchBatchOverview === "function") v44PatchBatchOverview(); }catch(err){}
    try{ if(typeof stableTudou2NavStep1 === "function") stableTudou2NavStep1("stock"); }catch(err){}
  }
  window.returnToBatchOverviewStep1 = returnToBatchOverviewStep1;

  document.addEventListener("click", function(ev){
    var cat = ev.target && ev.target.closest ? ev.target.closest("#inboundRoot #catPanel .cat") : null;
    if(cat){
      ev.preventDefault();
      ev.stopPropagation();
      if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      window.selectCreateGoodsCatStep1(cat.getAttribute("data-create-cat") || cat.textContent.trim() || "全");
      return false;
    }
    var card = ev.target && ev.target.closest ? ev.target.closest("#inboundRoot #goodsGrid .goods-card[data-goods-id]") : null;
    if(card){
      var goodsId = card.getAttribute("data-goods-id");
      if(goodsId && typeof toggleGoodsToBatch === "function"){
        ev.preventDefault();
        ev.stopPropagation();
        if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
        toggleGoodsToBatch(goodsId);
        return false;
      }
    }
    var back = ev.target && ev.target.closest ? ev.target.closest("#inboundRoot .back, #inboundRoot button") : null;
    if(back){
      var txt = (back.textContent || "").trim();
      if(txt === "← 返回批次" || txt === "返回批次" || txt === "← 返回"){
        ev.preventDefault();
        ev.stopPropagation();
        if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
        returnToBatchOverviewStep1();
        return false;
      }
    }
  }, true);

  var oldRenderAllStep1 = typeof window.renderAll === "function" ? window.renderAll : null;
  if(oldRenderAllStep1 && !oldRenderAllStep1.__createCatStep1Wrapped){
    window.renderAll = function(){
      var result;
      try{ result = oldRenderAllStep1.apply(this, arguments); }catch(err){}
      try{ window.renderCat(); window.renderGoods(); bindCreateCatAndBackStep1(); }catch(err){}
      return result;
    };
    window.renderAll.__createCatStep1Wrapped = true;
  }

  setTimeout(function(){ try{ window.renderCat(); window.renderGoods(); bindCreateCatAndBackStep1(); }catch(err){} }, 0);
  setTimeout(function(){ try{ bindCreateCatAndBackStep1(); }catch(err){} }, 300);
})();

/* extracted script block 26 */
/* ===== Step1 cashier polish: enable Add Buyer and multi-codebill customer tabs ===== */
(function(){
  var activeSessionId = "";
  var sessionCounter = 1;

  function listCustomers(){
    return (typeof cashierCustomers !== "undefined" && Array.isArray(cashierCustomers)) ? cashierCustomers : [];
  }

  function customerById(id){
    return listCustomers().find(function(c){ return c && c.id === id; }) || listCustomers()[0] || {id:"c1", name:"临时客户", debt:0};
  }

  function isTempCustomer(c){
    return !c || c.id === "c1" || String(c.name || "").startsWith("临时客户");
  }

  function currentCustomerId(){
    var sel = document.getElementById("cashierCustomer");
    return (sel && sel.value) || (customerById("c1").id || "c1");
  }

  function makeSession(customerId, name){
    var c = customerById(customerId);
    return {
      id:"tabs" + Date.now() + Math.floor(Math.random() * 1000) + "_" + (sessionCounter++),
      customerId:customerId || c.id || "c1",
      name:name || c.name || "临时客户",
      items:[]
    };
  }

  function ensureSessions(){
    if(!Array.isArray(window.cashierBillSessionsStep1) || !window.cashierBillSessionsStep1.length){
      window.cashierBillSessionsStep1 = [makeSession(currentCustomerId(), customerById(currentCustomerId()).name)];
      window.cashierBillSessionsStep1[0].items = Array.isArray(currentCodeBillItems) ? currentCodeBillItems : [];
      activeSessionId = window.cashierBillSessionsStep1[0].id;
    }
    if(!activeSessionId || !window.cashierBillSessionsStep1.some(function(s){ return s.id === activeSessionId; })){
      activeSessionId = window.cashierBillSessionsStep1[0].id;
    }
  }

  function activeSession(){
    ensureSessions();
    return window.cashierBillSessionsStep1.find(function(s){ return s.id === activeSessionId; }) || window.cashierBillSessionsStep1[0];
  }

  function syncSessionFromCurrent(){
    var s = activeSession();
    if(s) s.items = Array.isArray(currentCodeBillItems) ? currentCodeBillItems : [];
  }

  function applySessionToUI(s){
    if(!s) return;
    currentCodeBillItems = Array.isArray(s.items) ? s.items : [];
    var sel = document.getElementById("cashierCustomer");
    if(sel){
      renderCashierCustomers();
      sel.value = s.customerId;
    }
  }

  function tempSessionName(){
    var count = (window.cashierBillSessionsStep1 || []).filter(function(s){
      var c = customerById(s.customerId);
      return isTempCustomer(c);
    }).length + 1;
    return "临时客户" + count;
  }

  window.renderCashierCustomerTabsStep1 = function(){
    ensureSessions();
    var box = document.querySelector("#cashierRoot .order-tabs");
    if(!box) return;
    box.innerHTML = window.cashierBillSessionsStep1.map(function(s){
      var c = customerById(s.customerId);
      var isTemp = isTempCustomer(c);
      var label = isTemp ? (s.name || "临时客户") : (c.name || s.name || "买家");
      var qty = (s.items || []).length;
      return '<button type="button" class="order-tab '+(!isTemp ? 'formal ' : '')+(s.id === activeSessionId ? 'active' : '')+'" data-bill-session="'+s.id+'" title="'+esc(label)+'">'+esc(label)+(qty ? '｜'+qty : '')+'</button>';
    }).join("") + '<button type="button" class="order-add-tab" data-add-bill-session="1">＋</button>';
  };

  window.switchCashierBillSessionStep1 = function(id){
    ensureSessions();
    syncSessionFromCurrent();
    var s = window.cashierBillSessionsStep1.find(function(x){ return x.id === id; });
    if(!s) return;
    activeSessionId = s.id;
    applySessionToUI(s);
    try{ if(typeof enforceTemporaryCustomerRule === "function") enforceTemporaryCustomerRule(); }catch(err){}
    try{ if(typeof renderCurrentCodeBill === "function") renderCurrentCodeBill(); }catch(err){}
    try{ if(typeof renderCashierProducts === "function") renderCashierProducts(); }catch(err){}
  };

  window.addCashierBillSessionStep1 = function(customerId, name){
    ensureSessions();
    syncSessionFromCurrent();
    var s = makeSession(customerId || "c1", name || (customerId ? customerById(customerId).name : tempSessionName()));
    window.cashierBillSessionsStep1.push(s);
    activeSessionId = s.id;
    applySessionToUI(s);
    try{ if(typeof renderCurrentCodeBill === "function") renderCurrentCodeBill(); }catch(err){}
    try{ if(typeof renderCashierProducts === "function") renderCashierProducts(); }catch(err){}
    if(typeof toast === "function") toast("已新增一个客户码单");
    return s;
  };

  window.addCashierCustomer = function(){
    openCashierAddBuyerStep1();
  };

  function ensureAddBuyerModalStep1(){
    if(document.getElementById("cashierAddBuyerMaskStep1")) return;
    var mask = document.createElement("div");
    mask.id = "cashierAddBuyerMaskStep1";
    mask.innerHTML = '<div class="cashier-add-buyer-modal-step1">'
      + '<header><h3>新增买家</h3><button class="cancel" type="button" onclick="closeCashierAddBuyerStep1()">关闭</button></header>'
      + '<div class="body">'
      + '<input id="cashierAddBuyerNameStep1" placeholder="输入买家名称">'
      + '<div class="actions"><button class="cancel" type="button" onclick="closeCashierAddBuyerStep1()">取消</button><button class="save" type="button" onclick="saveCashierAddBuyerStep1()">确定新增</button></div>'
      + '</div></div>';
    document.body.appendChild(mask);
  }

  window.openCashierAddBuyerStep1 = function(){
    ensureAddBuyerModalStep1();
    var mask = document.getElementById("cashierAddBuyerMaskStep1");
    var input = document.getElementById("cashierAddBuyerNameStep1");
    if(input) input.value = "";
    if(mask) mask.classList.add("show");
    setTimeout(function(){ if(input) input.focus(); }, 30);
  };

  window.closeCashierAddBuyerStep1 = function(){
    var mask = document.getElementById("cashierAddBuyerMaskStep1");
    if(mask) mask.classList.remove("show");
  };

  window.saveCashierAddBuyerStep1 = function(){
    var input = document.getElementById("cashierAddBuyerNameStep1");
    var clean = String((input && input.value) || "").trim();
    if(!clean){
      if(typeof toast === "function") toast("请先输入买家名称");
      return;
    }
    var existed = listCustomers().find(function(c){ return c && c.name === clean; });
    var c = existed;
    if(!c){
      c = {id:"c" + Date.now(), name:clean, debt:0, payments:[]};
      listCustomers().push(c);
    }
    closeCashierAddBuyerStep1();
    try{ selectedBuyerV47Id = c.id; }catch(err){}
    try{ window.selectedCashierCustomerIdV116 = c.id; }catch(err){}
    try{ localStorage.setItem('CANGJIE_SELECTED_CUSTOMER_V116', c.id); }catch(err){}
    var session = typeof activeSession === "function" ? activeSession() : null;
    if(session){
      session.customerId = c.id;
      session.name = c.name;
      if(!Array.isArray(session.items)) session.items = Array.isArray(currentCodeBillItems) ? currentCodeBillItems : [];
    }
    try{
      var liveSession = typeof activeSessionV116 === "function" ? activeSessionV116() : null;
      if(liveSession){
        liveSession.customerId = c.id;
        liveSession.name = c.name;
      }
    }catch(err){}
    renderCashierCustomers();
    var sel = document.getElementById("cashierCustomer");
    if(sel){
      try{
        Array.from(sel.options || []).forEach(function(opt){ opt.selected = opt.value === c.id; });
      }catch(err){}
      try{
        var targetIndex = Array.from(sel.options || []).findIndex(function(opt){ return opt.value === c.id; });
        if(targetIndex >= 0) sel.selectedIndex = targetIndex;
      }catch(err){}
      sel.value = c.id;
      try{ sel.dispatchEvent(new Event("input", {bubbles:true})); }catch(err){}
      try{ sel.dispatchEvent(new Event("change", {bubbles:true})); }catch(err){}
    }
    try{
      if(typeof window.pickCashierBuyerDirectV82 === "function"){
        window.pickCashierBuyerDirectV82(c.id);
      }else if(typeof window.selectCashierBuyerTreeV82 === "function"){
        window.selectCashierBuyerTreeV82(c.id);
      }
    }catch(err){}
    try{ if(typeof handleCustomerOrPayChange === "function") handleCustomerOrPayChange(); }
    catch(err){ if(typeof renderCurrentCodeBill === "function") renderCurrentCodeBill(); }
    try{ if(typeof syncCustomerStateV116 === 'function') syncCustomerStateV116(c.id); }catch(err){}
    try{ window.currentBuyer = c; window.selectedBuyer = c; }catch(err){}
    if(typeof renderBuyerV47 === "function") renderBuyerV47();
    if(typeof tudou2SaveNow === "function") setTimeout(tudou2SaveNow, 0);
    setTimeout(function(){
      try{ selectedBuyerV47Id = c.id; }catch(err){}
      try{ window.selectedCashierCustomerIdV116 = c.id; }catch(err){}
      try{ localStorage.setItem('CANGJIE_SELECTED_CUSTOMER_V116', c.id); }catch(err){}
      try{
        var liveSel = document.getElementById("cashierCustomer");
        if(liveSel){
          Array.from(liveSel.options || []).forEach(function(opt){ opt.selected = opt.value === c.id; });
          var liveIndex = Array.from(liveSel.options || []).findIndex(function(opt){ return opt.value === c.id; });
          if(liveIndex >= 0) liveSel.selectedIndex = liveIndex;
          liveSel.value = c.id;
          try{ liveSel.dispatchEvent(new Event("input", {bubbles:true})); }catch(err){}
          try{ liveSel.dispatchEvent(new Event("change", {bubbles:true})); }catch(err){}
        }
      }catch(err){}
      try{ if(typeof window.syncCustomerStateV116 === "function") window.syncCustomerStateV116(c.id); }catch(err){}
      try{ if(typeof handleCustomerOrPayChange === "function") handleCustomerOrPayChange(); }catch(err){}
      try{ window.currentBuyer = c; window.selectedBuyer = c; }catch(err){}
      try{ if(typeof window.renderCashierBuyerTreeV82 === "function") window.renderCashierBuyerTreeV82(); }catch(err){}
    }, 0);
    if(typeof toast === "function") toast(existed ? "已切换买家，当前商品已保留" : "买家已新增，当前商品已保留");
  };

  var oldRenderCashierCustomersStep1 = typeof window.renderCashierCustomers === "function" ? window.renderCashierCustomers : null;
  window.renderCashierCustomers = function(){
    var sel = document.getElementById("cashierCustomer");
    if(!sel) return;
    var old = sel.value || currentCustomerId();
    sel.innerHTML = listCustomers().map(function(c){
      return '<option value="'+esc(c.id)+'">'+esc(c.name)+(Number(c.debt || 0) > 0 ? "｜欠" + money(c.debt) : "")+'</option>';
    }).join("");
    if(listCustomers().some(function(c){ return c.id === old; })) sel.value = old;
    else if(listCustomers()[0]) sel.value = listCustomers()[0].id;
  };
  if(oldRenderCashierCustomersStep1) oldRenderCashierCustomersStep1 = null;

  var oldRenderCurrentCodeBillStep1 = typeof window.renderCurrentCodeBill === "function" ? window.renderCurrentCodeBill : null;
  if(oldRenderCurrentCodeBillStep1 && !oldRenderCurrentCodeBillStep1.__multiBillStep1Wrapped){
    window.renderCurrentCodeBill = function(){
      ensureSessions();
      var s = activeSession();
      if(s){
        s.items = currentCodeBillItems;
        var sel = document.getElementById("cashierCustomer");
        if(sel && sel.value){
          s.customerId = sel.value;
          var c = customerById(sel.value);
          if(c && !isTempCustomer(c)) s.name = c.name;
        }
      }
      var result = oldRenderCurrentCodeBillStep1.apply(this, arguments);
      window.renderCashierCustomerTabsStep1();
      return result;
    };
    window.renderCurrentCodeBill.__multiBillStep1Wrapped = true;
  }

  var oldHandleCustomerOrPayChangeStep1 = typeof window.handleCustomerOrPayChange === "function" ? window.handleCustomerOrPayChange : null;
  window.handleCustomerOrPayChange = function(){
    ensureSessions();
    var s = activeSession();
    var sel = document.getElementById("cashierCustomer");
    if(s && sel && sel.value){
      s.customerId = sel.value;
      var c = customerById(sel.value);
      if(c && !isTempCustomer(c)) s.name = c.name;
    }
    if(oldHandleCustomerOrPayChangeStep1) oldHandleCustomerOrPayChangeStep1.apply(this, arguments);
    else if(typeof renderCurrentCodeBill === "function") renderCurrentCodeBill();
    window.renderCashierCustomerTabsStep1();
  };

  ["addProductToCodeBill","removeCodeBillItem","updateCodeBillItem"].forEach(function(name){
    var oldFn = window[name];
    if(typeof oldFn !== "function" || oldFn.__multiBillStep1Wrapped) return;
    window[name] = function(){
      ensureSessions();
      var result = oldFn.apply(this, arguments);
      syncSessionFromCurrent();
      window.renderCashierCustomerTabsStep1();
      return result;
    };
    window[name].__multiBillStep1Wrapped = true;
  });

  ["confirmOrderFromCodeBill","completeSettleOrder","checkoutCurrentOrder"].forEach(function(name){
    var oldFn = window[name];
    if(typeof oldFn !== "function" || oldFn.__multiBillStep1Wrapped) return;
    window[name] = function(){
      var s = activeSession();
      var beforeLen = Array.isArray(currentCodeBillItems) ? currentCodeBillItems.length : 0;
      var result = oldFn.apply(this, arguments);
      if(beforeLen && (!currentCodeBillItems || !currentCodeBillItems.length) && s){
        s.items = [];
      }
      window.renderCashierCustomerTabsStep1();
      return result;
    };
    window[name].__multiBillStep1Wrapped = true;
  });

  document.addEventListener("click", function(ev){
    var add = ev.target && ev.target.closest ? ev.target.closest("#cashierRoot [data-add-bill-session]") : null;
    if(add){
      ev.preventDefault();
      ev.stopPropagation();
      if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      window.addCashierBillSessionStep1("c1", tempSessionName());
      return false;
    }
    var tab = ev.target && ev.target.closest ? ev.target.closest("#cashierRoot [data-bill-session]") : null;
    if(tab){
      ev.preventDefault();
      ev.stopPropagation();
      if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      window.switchCashierBillSessionStep1(tab.getAttribute("data-bill-session"));
      return false;
    }
    var addBuyer = ev.target && ev.target.closest ? ev.target.closest("#cashierRoot button") : null;
    if(addBuyer && (addBuyer.textContent || "").trim() === "新增买家"){
      ev.preventDefault();
      ev.stopPropagation();
      if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      openCashierAddBuyerStep1();
      return false;
    }
  }, true);

  document.addEventListener("keydown", function(ev){
    if(ev.key !== "Enter") return;
    var input = ev.target && ev.target.id === "cashierAddBuyerNameStep1" ? ev.target : null;
    if(input){
      ev.preventDefault();
      saveCashierAddBuyerStep1();
    }
  }, true);

  setTimeout(function(){
    ensureSessions();
    renderCashierCustomers();
    applySessionToUI(activeSession());
    if(typeof renderCurrentCodeBill === "function") renderCurrentCodeBill();
  }, 0);
})();

/* extracted script block 27 */
/* ===== Step1 cashier polish: add order remark to bill/order ===== */
(function(){
  function ensureOrderRemarkFieldStep1(){
    if(document.getElementById("cashierOrderRemarkStep1")) return;
    var discountBox = document.querySelector("#cashierRoot .discount-box");
    if(!discountBox) return;
    var wrap = document.createElement("div");
    wrap.className = "order-remark-box-step1";
    wrap.innerHTML = '<input id="cashierOrderRemarkStep1" placeholder="订单备注，可不填" oninput="renderCurrentCodeBill()">';
    discountBox.insertAdjacentElement("afterend", wrap);
  }

  function activeBillSessionStep1(){
    try{
      var sessions = window.cashierBillSessionsStep1 || [];
      var activeBtn = document.querySelector("#cashierRoot .order-tab.active[data-bill-session]");
      var id = activeBtn ? activeBtn.getAttribute("data-bill-session") : "";
      return sessions.find(function(s){ return s.id === id; }) || sessions[0] || null;
    }catch(err){
      return null;
    }
  }

  function currentRemarkStep1(){
    var input = document.getElementById("cashierOrderRemarkStep1");
    return String((input && input.value) || "").trim();
  }

  function syncRemarkToSessionStep1(){
    var s = activeBillSessionStep1();
    if(s) s.orderRemark = currentRemarkStep1();
  }

  function applyRemarkFromSessionStep1(){
    ensureOrderRemarkFieldStep1();
    var input = document.getElementById("cashierOrderRemarkStep1");
    if(!input) return;
    var s = activeBillSessionStep1();
    input.value = (s && s.orderRemark) || "";
  }

  var oldBuildCodeBillStep1 = typeof window.buildCodeBill === "function" ? window.buildCodeBill : null;
  if(oldBuildCodeBillStep1 && !oldBuildCodeBillStep1.__orderRemarkStep1Wrapped){
    window.buildCodeBill = function(){
      syncRemarkToSessionStep1();
      var bill = oldBuildCodeBillStep1.apply(this, arguments);
      var remark = currentRemarkStep1();
      bill.orderRemark = remark;
      bill.remark = remark;
      if(remark && bill.text && !bill.text.includes("订单备注：")){
        bill.text += "\n订单备注：" + remark;
      }
      return bill;
    };
    window.buildCodeBill.__orderRemarkStep1Wrapped = true;
  }

  var oldRenderCurrentCodeBillRemarkStep1 = typeof window.renderCurrentCodeBill === "function" ? window.renderCurrentCodeBill : null;
  if(oldRenderCurrentCodeBillRemarkStep1 && !oldRenderCurrentCodeBillRemarkStep1.__orderRemarkStep1Wrapped){
    window.renderCurrentCodeBill = function(){
      ensureOrderRemarkFieldStep1();
      syncRemarkToSessionStep1();
      var result = oldRenderCurrentCodeBillRemarkStep1.apply(this, arguments);
      ensureOrderRemarkFieldStep1();
      return result;
    };
    window.renderCurrentCodeBill.__orderRemarkStep1Wrapped = true;
  }

  var oldSwitchSessionRemarkStep1 = typeof window.switchCashierBillSessionStep1 === "function" ? window.switchCashierBillSessionStep1 : null;
  if(oldSwitchSessionRemarkStep1 && !oldSwitchSessionRemarkStep1.__orderRemarkStep1Wrapped){
    window.switchCashierBillSessionStep1 = function(id){
      syncRemarkToSessionStep1();
      var result = oldSwitchSessionRemarkStep1.apply(this, arguments);
      setTimeout(applyRemarkFromSessionStep1, 0);
      return result;
    };
    window.switchCashierBillSessionStep1.__orderRemarkStep1Wrapped = true;
  }

  var oldAddSessionRemarkStep1 = typeof window.addCashierBillSessionStep1 === "function" ? window.addCashierBillSessionStep1 : null;
  if(oldAddSessionRemarkStep1 && !oldAddSessionRemarkStep1.__orderRemarkStep1Wrapped){
    window.addCashierBillSessionStep1 = function(){
      syncRemarkToSessionStep1();
      var s = oldAddSessionRemarkStep1.apply(this, arguments);
      if(s) s.orderRemark = "";
      setTimeout(applyRemarkFromSessionStep1, 0);
      return s;
    };
    window.addCashierBillSessionStep1.__orderRemarkStep1Wrapped = true;
  }

  ["confirmOrderFromCodeBill","completeSettleOrder","checkoutCurrentOrder"].forEach(function(name){
    var oldFn = window[name];
    if(typeof oldFn !== "function" || oldFn.__orderRemarkStep1Wrapped) return;
    window[name] = function(){
      syncRemarkToSessionStep1();
      var result = oldFn.apply(this, arguments);
      setTimeout(function(){
        if(!window.currentCodeBillItems || !window.currentCodeBillItems.length){
          var input = document.getElementById("cashierOrderRemarkStep1");
          if(input) input.value = "";
          var s = activeBillSessionStep1();
          if(s) s.orderRemark = "";
        }
      }, 30);
      return result;
    };
    window[name].__orderRemarkStep1Wrapped = true;
  });

  document.addEventListener("input", function(ev){
    if(ev.target && ev.target.id === "cashierOrderRemarkStep1"){
      syncRemarkToSessionStep1();
    }
  }, true);

  setTimeout(function(){
    ensureOrderRemarkFieldStep1();
    applyRemarkFromSessionStep1();
  }, 0);
})();

/* extracted script block 28 */
/* ===== Step1 buyer polish: sub buyers / branch stores under a parent buyer ===== */
(function(){
  function buyersStep1(){
    return (typeof cashierCustomers !== "undefined" && Array.isArray(cashierCustomers)) ? cashierCustomers : [];
  }

  function buyerByIdStep1(id){
    return buyersStep1().find(function(c){ return c && c.id === id; }) || null;
  }

  function isTempBuyerStep1(b){
    return !b || b.id === "c1" || b.name === "临时客户";
  }

  function childBuyersStep1(parentId){
    return buyersStep1().filter(function(c){ return c && c.parentId === parentId; });
  }

  function familyIdsStep1(id){
    var buyer = buyerByIdStep1(id);
    if(!buyer) return [id];
    if(buyer.parentId) return [buyer.id];
    return [buyer.id].concat(childBuyersStep1(buyer.id).map(function(c){ return c.id; }));
  }

  function buyerMatchesOrderStep1(buyer, order){
    if(!buyer || !order) return false;
    return order.customerId === buyer.id || order.customerName === buyer.name;
  }

  var baseBuyerOrdersForStep1 = typeof window.buyerV47OrdersFor === "function" ? window.buyerV47OrdersFor : null;
  window.buyerV47OrdersFor = function(id){
    var ids = familyIdsStep1(id);
    var family = ids.map(buyerByIdStep1).filter(Boolean);
    var sourceOrders = (typeof finalOrders !== "undefined" && Array.isArray(finalOrders) ? finalOrders : []);
    if(typeof window.cangjieFilterOrdersForCurrentAccountV94 === "function") sourceOrders = window.cangjieFilterOrdersForCurrentAccountV94(sourceOrders);
    var rows = sourceOrders.filter(function(o){
      return family.some(function(b){ return buyerMatchesOrderStep1(b, o); });
    });
    if(!rows.length && baseBuyerOrdersForStep1) rows = baseBuyerOrdersForStep1(id) || [];
    return rows.sort(function(a,b){ return String(b.time || "").localeCompare(String(a.time || "")); });
  };

  var baseBuyerPaymentsForStep1 = typeof window.buyerV47PaymentsFor === "function" ? window.buyerV47PaymentsFor : null;
  window.buyerV47PaymentsFor = function(id){
    var ids = familyIdsStep1(id);
    var family = ids.map(buyerByIdStep1).filter(Boolean);
    var direct = [];
    var canViewAll = typeof window.cangjieCanViewAllOrdersV94 === "function" ? window.cangjieCanViewAllOrdersV94() : true;
    if(canViewAll){
      family.forEach(function(b){
        (Array.isArray(b.payments) ? b.payments : []).forEach(function(p){
          direct.push(Object.assign({buyerName:b.name}, p));
        });
      });
    }
    var fromOrders = [];
    var sourceOrders = (typeof finalOrders !== "undefined" && Array.isArray(finalOrders) ? finalOrders : []);
    if(typeof window.cangjieFilterOrdersForCurrentAccountV94 === "function") sourceOrders = window.cangjieFilterOrdersForCurrentAccountV94(sourceOrders);
    sourceOrders.forEach(function(o){
      if(family.some(function(b){ return buyerMatchesOrderStep1(b, o); })){
        (o.payments || []).forEach(function(p){
          fromOrders.push(Object.assign({buyerName:o.customerName || "", orderNo:o.orderNo || o.billNo || ""}, p));
        });
      }
    });
    var rows = direct.concat(fromOrders);
    if(!rows.length && baseBuyerPaymentsForStep1) rows = baseBuyerPaymentsForStep1(id) || [];
    return rows.sort(function(a,b){ return String(b.time || "").localeCompare(String(a.time || "")); });
  };

  window.recalcBuyerV47Debt = function(id){
    var buyer = buyerByIdStep1(id);
    if(!buyer) return 0;
    var debt = window.buyerV47OrdersFor(id).reduce(function(s,o){
      return s + (typeof buyerV47DebtAmount === "function" ? buyerV47DebtAmount(o) : Number(o.debt || 0));
    }, 0);
    buyer.debt = Number(debt || 0);
    return buyer.debt;
  };

  function ensureSubstoreSectionStep1(){
    if(document.getElementById("buyerSubstoresStep1")) return;
    var info = document.querySelector("#buyerManagerV47 .buyer-v47-info-grid");
    if(!info) return;
    var sec = document.createElement("section");
    sec.id = "buyerSubstoresStep1";
    sec.className = "buyer-substores-step1";
    sec.innerHTML = '<h3><span>名下门店</span><span class="buyer-substore-actions-step1"><button class="green" type="button" onclick="addSubBuyerV47Step1()">新增门店</button><button class="blue" type="button" onclick="linkExistingSubBuyerV47Step1()">关联已有买家</button></span></h3><div id="buyerSubstoreListStep1" class="buyer-substore-list-step1"></div>';
    info.insertAdjacentElement("afterend", sec);
  }

  window.renderSubBuyerV47Step1 = function(){
    ensureSubstoreSectionStep1();
    var box = document.getElementById("buyerSubstoreListStep1");
    var sec = document.getElementById("buyerSubstoresStep1");
    var buyer = buyerByIdStep1(typeof selectedBuyerV47Id !== "undefined" ? selectedBuyerV47Id : "");
    if(!box || !sec || !buyer) return;
    if(isTempBuyerStep1(buyer)){
      sec.style.display = "none";
      return;
    }
    sec.style.display = "";
    var parent = buyer.parentId ? buyerByIdStep1(buyer.parentId) : null;
    if(parent){
      box.innerHTML = '<div class="buyer-substore-empty-step1">当前是门店，所属主买家：<b>'+esc(parent.name)+'</b></div>';
      return;
    }
    var children = childBuyersStep1(buyer.id);
    if(!children.length){
      box.innerHTML = '<div class="buyer-substore-empty-step1">暂无名下门店。可以新增“清秀”“防城”等分店，或关联已有买家。</div>';
      return;
    }
    box.innerHTML = children.map(function(c){
      var orders = window.buyerV47OrdersFor(c.id);
      var debt = typeof recalcBuyerV47Debt === "function" ? recalcBuyerV47Debt(c.id) : Number(c.debt || 0);
      return '<div class="buyer-substore-card-step1">'
        + '<b>'+esc(c.name)+'</b>'
        + '<span>订单：'+orders.length+' 单｜欠款：'+money(debt)+'</span>'
        + '<div class="row"><button class="open" type="button" data-open-sub-buyer="'+esc(c.id)+'">查看门店</button><button class="remove" type="button" data-unlink-sub-buyer="'+esc(c.id)+'">取消关联</button></div>'
        + '</div>';
    }).join("");
  };

  var oldRenderBuyerListStep1 = typeof window.renderBuyerV47List === "function" ? window.renderBuyerV47List : null;
  if(oldRenderBuyerListStep1 && !oldRenderBuyerListStep1.__subBuyerStep1Wrapped){
    window.renderBuyerV47List = function(){
      oldRenderBuyerListStep1.apply(this, arguments);
      var box = document.getElementById("buyerV47List");
      if(!box) return;
      box.querySelectorAll(".buyer-v47-card").forEach(function(card){
        var name = card.querySelector("b") ? card.querySelector("b").textContent : "";
        var buyer = buyersStep1().find(function(c){ return c.name === name; });
        if(!buyer) return;
        if(buyer.parentId) card.classList.add("child-step1");
        if(childBuyersStep1(buyer.id).length) card.classList.add("parent-step1");
      });
    };
    window.renderBuyerV47List.__subBuyerStep1Wrapped = true;
  }

  var oldRenderBuyerDetailStep1 = typeof window.renderBuyerV47Detail === "function" ? window.renderBuyerV47Detail : null;
  if(oldRenderBuyerDetailStep1 && !oldRenderBuyerDetailStep1.__subBuyerStep1Wrapped){
    window.renderBuyerV47Detail = function(){
      var result = oldRenderBuyerDetailStep1.apply(this, arguments);
      var buyer = buyerByIdStep1(typeof selectedBuyerV47Id !== "undefined" ? selectedBuyerV47Id : "");
      if(buyer){
        var children = childBuyersStep1(buyer.id);
        var sub = document.getElementById("buyerV47Sub");
        if(sub && buyer.parentId){
          var p = buyerByIdStep1(buyer.parentId);
          sub.textContent = "门店｜所属主买家：" + (p ? p.name : "未找到");
        }else if(sub && children.length){
          sub.textContent = "主买家｜名下门店：" + children.map(function(c){ return c.name; }).join("、");
        }
        var type = document.getElementById("buyerV47Type");
        if(type && buyer.parentId) type.textContent = "门店";
        else if(type && children.length) type.textContent = "主买家";
      }
      window.renderSubBuyerV47Step1();
      return result;
    };
    window.renderBuyerV47Detail.__subBuyerStep1Wrapped = true;
  }

  window.addSubBuyerV47Step1 = function(){
    var parent = buyerByIdStep1(typeof selectedBuyerV47Id !== "undefined" ? selectedBuyerV47Id : "");
    if(!parent || isTempBuyerStep1(parent) || parent.parentId){
      alert("请先选择一个正式主买家。");
      return;
    }
    var name = prompt("请输入门店名称：");
    if(!name) return;
    var clean = name.trim();
    if(!clean) return;
    var existed = buyersStep1().find(function(c){ return c.name === clean; });
    if(existed){
      existed.parentId = parent.id;
    }else{
      buyersStep1().push({id:"c" + Date.now(), name:clean, debt:0, payments:[], parentId:parent.id});
    }
    if(typeof renderCashierCustomers === "function") renderCashierCustomers();
    if(typeof renderBuyerV47 === "function") renderBuyerV47();
    if(typeof tudou2SaveNow === "function") setTimeout(tudou2SaveNow, 0);
    if(typeof toast === "function") toast("门店已关联到：" + parent.name);
  };

  window.linkExistingSubBuyerV47Step1 = function(){
    var parent = buyerByIdStep1(typeof selectedBuyerV47Id !== "undefined" ? selectedBuyerV47Id : "");
    if(!parent || isTempBuyerStep1(parent) || parent.parentId){
      alert("请先选择一个正式主买家。");
      return;
    }
    var name = prompt("请输入要关联的已有买家名称：");
    if(!name) return;
    var clean = name.trim();
    var child = buyersStep1().find(function(c){ return c.name === clean; });
    if(!child){
      alert("没有找到这个买家。");
      return;
    }
    if(child.id === parent.id){
      alert("不能把主买家关联到自己名下。");
      return;
    }
    child.parentId = parent.id;
    if(typeof renderBuyerV47 === "function") renderBuyerV47();
    if(typeof tudou2SaveNow === "function") setTimeout(tudou2SaveNow, 0);
    if(typeof toast === "function") toast("已关联门店：" + child.name);
  };

  window.unlinkSubBuyerV47Step1 = function(childId){
    var child = buyerByIdStep1(childId);
    if(!child) return;
    child.parentId = "";
    if(typeof renderBuyerV47 === "function") renderBuyerV47();
    if(typeof tudou2SaveNow === "function") setTimeout(tudou2SaveNow, 0);
    if(typeof toast === "function") toast("已取消门店关联");
  };

  document.addEventListener("click", function(ev){
    var open = ev.target && ev.target.closest ? ev.target.closest("[data-open-sub-buyer]") : null;
    if(open){
      ev.preventDefault();
      ev.stopPropagation();
      if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      if(typeof selectBuyerV47 === "function") selectBuyerV47(open.getAttribute("data-open-sub-buyer"));
      return false;
    }
    var unlink = ev.target && ev.target.closest ? ev.target.closest("[data-unlink-sub-buyer]") : null;
    if(unlink){
      ev.preventDefault();
      ev.stopPropagation();
      if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      window.unlinkSubBuyerV47Step1(unlink.getAttribute("data-unlink-sub-buyer"));
      return false;
    }
  }, true);

  setTimeout(function(){
    buyersStep1().forEach(function(c){ if(typeof c.parentId === "undefined") c.parentId = ""; });
    if(typeof renderBuyerV47 === "function") renderBuyerV47();
  }, 0);
})();

/* extracted script block 29 */
/* ===== Step1 buyer polish: make sub-store add/link actually selectable ===== */
(function(){
  function buyers(){
    return (typeof cashierCustomers !== "undefined" && Array.isArray(cashierCustomers)) ? cashierCustomers : [];
  }
  function buyerById(id){
    return buyers().find(function(c){ return c && c.id === id; }) || null;
  }
  function selectedParent(){
    return buyerById(typeof selectedBuyerV47Id !== "undefined" ? selectedBuyerV47Id : "");
  }
  function isTemp(b){
    return !b || b.id === "c1" || b.name === "临时客户";
  }
  function childOf(parentId){
    return buyers().filter(function(c){ return c && c.parentId === parentId; });
  }
  function refreshBuyerViews(){
    if(typeof renderCashierCustomers === "function") renderCashierCustomers();
    if(typeof renderBuyerV47 === "function") renderBuyerV47();
    if(typeof tudou2SaveNow === "function") setTimeout(tudou2SaveNow, 0);
  }

  function ensureModal(){
    if(document.getElementById("subBuyerPickerStep1")) return;
    var mask = document.createElement("div");
    mask.id = "subBuyerPickerStep1";
    mask.innerHTML = '<div class="sub-buyer-picker-modal-step1">'
      + '<header><h3 id="subBuyerPickerTitleStep1">名下门店</h3><button class="cancel" type="button" onclick="closeSubBuyerPickerStep1()">关闭</button></header>'
      + '<div class="body" id="subBuyerPickerBodyStep1"></div>'
      + '</div>';
    document.body.appendChild(mask);
  }

  window.closeSubBuyerPickerStep1 = function(){
    var mask = document.getElementById("subBuyerPickerStep1");
    if(mask) mask.classList.remove("show");
  };

  window.addSubBuyerV47Step1 = function(){
    var parent = selectedParent();
    if(!parent || isTemp(parent) || parent.parentId){
      alert("请先选择一个正式主买家。");
      return;
    }
    ensureModal();
    document.getElementById("subBuyerPickerTitleStep1").textContent = "新增门店";
    document.getElementById("subBuyerPickerBodyStep1").innerHTML =
      '<input id="subBuyerNameInputStep1" placeholder="输入门店名称，例如：清秀 / 防城">'
      + '<div class="actions"><button class="cancel" type="button" onclick="closeSubBuyerPickerStep1()">取消</button><button class="save" type="button" onclick="saveNewSubBuyerStep1()">确定新增</button></div>';
    document.getElementById("subBuyerPickerStep1").classList.add("show");
    setTimeout(function(){
      var input = document.getElementById("subBuyerNameInputStep1");
      if(input) input.focus();
    }, 30);
  };

  window.saveNewSubBuyerStep1 = function(){
    var parent = selectedParent();
    var input = document.getElementById("subBuyerNameInputStep1");
    var clean = String((input && input.value) || "").trim();
    if(!parent || !clean) return;
    var existed = buyers().find(function(c){ return c.name === clean; });
    if(existed){
      existed.parentId = parent.id;
    }else{
      buyers().push({id:"c" + Date.now(), name:clean, debt:0, payments:[], parentId:parent.id});
    }
    closeSubBuyerPickerStep1();
    refreshBuyerViews();
    if(typeof toast === "function") toast("门店已关联到：" + parent.name);
  };

  window.linkExistingSubBuyerV47Step1 = function(){
    var parent = selectedParent();
    if(!parent || isTemp(parent) || parent.parentId){
      alert("请先选择一个正式主买家。");
      return;
    }
    ensureModal();
    var linked = {};
    childOf(parent.id).forEach(function(c){ linked[c.id] = true; });
    var options = buyers().filter(function(c){
      return c && c.id !== parent.id && !isTemp(c) && !linked[c.id];
    });
    document.getElementById("subBuyerPickerTitleStep1").textContent = "关联已有买家";
    document.getElementById("subBuyerPickerBodyStep1").innerHTML = options.length
      ? '<div class="sub-buyer-link-list-step1">' + options.map(function(c){
          var parentText = c.parentId ? "已属于其他主买家，点击后改挂到当前主买家" : "可关联";
          return '<button type="button" class="sub-buyer-link-option-step1" data-link-existing-sub-buyer="'+esc(c.id)+'"><b>'+esc(c.name)+'</b><span>'+parentText+'</span></button>';
        }).join("") + '</div>'
      : '<div style="padding:18px;text-align:center;color:#6c756b;font-weight:900">暂无可关联的已有买家</div>';
    document.getElementById("subBuyerPickerStep1").classList.add("show");
  };

  window.linkExistingSubBuyerByIdStep1 = function(childId){
    var parent = selectedParent();
    var child = buyerById(childId);
    if(!parent || !child || child.id === parent.id) return;
    child.parentId = parent.id;
    closeSubBuyerPickerStep1();
    refreshBuyerViews();
    if(typeof toast === "function") toast("已关联门店：" + child.name);
  };

  document.addEventListener("click", function(ev){
    var addBtn = ev.target && ev.target.closest ? ev.target.closest("#buyerSubstoresStep1 button") : null;
    if(addBtn){
      var txt = (addBtn.textContent || "").trim();
      if(txt === "新增门店" || txt === "关联已有买家"){
        ev.preventDefault();
        ev.stopPropagation();
        if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
        if(txt === "新增门店") window.addSubBuyerV47Step1();
        else window.linkExistingSubBuyerV47Step1();
        return false;
      }
    }
    var option = ev.target && ev.target.closest ? ev.target.closest("[data-link-existing-sub-buyer]") : null;
    if(option){
      ev.preventDefault();
      ev.stopPropagation();
      if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      window.linkExistingSubBuyerByIdStep1(option.getAttribute("data-link-existing-sub-buyer"));
      return false;
    }
  }, true);

  document.addEventListener("keydown", function(ev){
    if(ev.key !== "Enter") return;
    if(ev.target && ev.target.id === "subBuyerNameInputStep1"){
      ev.preventDefault();
      window.saveNewSubBuyerStep1();
    }
  }, true);
})();

/* extracted script block 30 */
/* ===== Step1 cashier polish: delete unused multi-codebill tabs ===== */
(function(){
  var activeTabIdStep1 = "";

  function sessions(){
    return Array.isArray(window.cashierBillSessionsStep1) ? window.cashierBillSessionsStep1 : [];
  }

  function currentActiveId(){
    if(activeTabIdStep1 && sessions().some(function(s){ return s.id === activeTabIdStep1; })){
      return activeTabIdStep1;
    }
    var active = document.querySelector("#cashierRoot .order-tab.active[data-bill-session]");
    return active ? active.getAttribute("data-bill-session") : (sessions()[0] && sessions()[0].id);
  }

  function customerLabel(session){
    try{
      var buyers = (typeof cashierCustomers !== "undefined" && Array.isArray(cashierCustomers)) ? cashierCustomers : [];
      var c = buyers.find(function(x){ return x.id === session.customerId; });
      var isTemp = !c || c.id === "c1" || String(c.name || "").startsWith("临时客户");
      return isTemp ? (session.name || "临时客户") : (c.name || session.name || "买家");
    }catch(err){
      return session.name || "客户";
    }
  }

  var oldRenderTabsClosableStep1 = typeof window.renderCashierCustomerTabsStep1 === "function" ? window.renderCashierCustomerTabsStep1 : null;
  window.renderCashierCustomerTabsStep1 = function(){
    var box = document.querySelector("#cashierRoot .order-tabs");
    if(!box){
      if(oldRenderTabsClosableStep1) return oldRenderTabsClosableStep1.apply(this, arguments);
      return;
    }
    if(!sessions().length && oldRenderTabsClosableStep1){
      oldRenderTabsClosableStep1.apply(this, arguments);
    }
    var list = sessions();
    if(!list.length) return;
    var activeId = currentActiveId() || list[0].id;
    activeTabIdStep1 = activeId;
    box.innerHTML = list.map(function(s){
      var label = customerLabel(s);
      var qty = (s.items || []).length;
      var cls = (s.id === activeId ? " active" : "") + (list.length <= 1 ? " only-session-step1" : "");
      return '<button type="button" class="order-tab'+cls+'" data-bill-session="'+esc(s.id)+'" title="'+esc(label)+'">'
        + '<span>'+esc(label)+(qty ? "｜"+qty : "")+'</span>'
        + '<span class="order-tab-close-step1" data-close-bill-session="'+esc(s.id)+'">×</span>'
        + '</button>';
    }).join("") + '<button type="button" class="order-add-tab" data-add-bill-session="1">＋</button>';
  };

  window.closeCashierBillSessionStep1 = function(id){
    var list = sessions();
    if(list.length <= 1){
      if(typeof toast === "function") toast("至少保留一个客户码单");
      return;
    }
    var idx = list.findIndex(function(s){ return s.id === id; });
    if(idx < 0) return;
    var closingActive = id === currentActiveId();
    list.splice(idx, 1);
    var next = list[Math.max(0, idx - 1)] || list[0];
    if(closingActive && next) activeTabIdStep1 = next.id;
    if(closingActive && next && typeof window.switchCashierBillSessionStep1 === "function"){
      window.switchCashierBillSessionStep1(next.id);
    }else{
      window.renderCashierCustomerTabsStep1();
    }
    if(typeof tudou2SaveNow === "function") setTimeout(tudou2SaveNow, 0);
    if(typeof toast === "function") toast("已删除该客户码单");
  };

  document.addEventListener("click", function(ev){
    var tabBtn = ev.target && ev.target.closest ? ev.target.closest("#cashierRoot .order-tab[data-bill-session]") : null;
    if(tabBtn && !(ev.target.closest && ev.target.closest("[data-close-bill-session]"))){
      ev.preventDefault();
      ev.stopPropagation();
      if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      var id = tabBtn.getAttribute("data-bill-session");
      if(id && typeof window.switchCashierBillSessionStep1 === "function"){
        activeTabIdStep1 = id;
        window.switchCashierBillSessionStep1(id);
        setTimeout(function(){ window.renderCashierCustomerTabsStep1(); }, 0);
      }
      return false;
    }

    var close = ev.target && ev.target.closest ? ev.target.closest("#cashierRoot [data-close-bill-session]") : null;
    if(!close) return;
    ev.preventDefault();
    ev.stopPropagation();
    if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    window.closeCashierBillSessionStep1(close.getAttribute("data-close-bill-session"));
    return false;
  }, true);

  document.addEventListener("pointerdown", function(ev){
    var tabBtn = ev.target && ev.target.closest ? ev.target.closest("#cashierRoot .order-tab[data-bill-session]") : null;
    if(tabBtn && !(ev.target.closest && ev.target.closest("[data-close-bill-session]"))){
      ev.preventDefault();
      ev.stopPropagation();
      if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      var id = tabBtn.getAttribute("data-bill-session");
      if(id && typeof window.switchCashierBillSessionStep1 === "function"){
        activeTabIdStep1 = id;
        window.switchCashierBillSessionStep1(id);
        setTimeout(function(){ window.renderCashierCustomerTabsStep1(); }, 0);
      }
      return false;
    }

    var close = ev.target && ev.target.closest ? ev.target.closest("#cashierRoot [data-close-bill-session]") : null;
    if(!close) return;
    ev.preventDefault();
    ev.stopPropagation();
    if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    window.closeCashierBillSessionStep1(close.getAttribute("data-close-bill-session"));
    return false;
  }, true);

  setTimeout(function(){
    if(typeof window.renderCashierCustomerTabsStep1 === "function") window.renderCashierCustomerTabsStep1();
  }, 0);
})();

/* extracted script block 31 */
/* ===== Step1 buyer polish: disable / enable buyers ===== */
(function(){
  function buyers(){
    return (typeof cashierCustomers !== "undefined" && Array.isArray(cashierCustomers)) ? cashierCustomers : [];
  }
  function buyerById(id){
    return buyers().find(function(c){ return c && c.id === id; }) || null;
  }
  function selectedBuyer(){
    return buyerById(typeof selectedBuyerV47Id !== "undefined" ? selectedBuyerV47Id : "");
  }
  function isDisabled(c){
    return !!(c && c.disabled);
  }
  function isTemp(c){
    return !c || c.id === "c1" || c.name === "临时客户";
  }
  function outstandingDebt(c){
    if(!c) return 0;
    if(typeof recalcBuyerV47Debt === "function"){
      return Number(recalcBuyerV47Debt(c.id) || 0);
    }
    return Number(c.debt || 0);
  }
  function restoreIfHasDebt(c){
    if(!c || !isDisabled(c)) return false;
    if(outstandingDebt(c) <= 0.0001) return false;
    c.disabled = false;
    c.disabledAt = "";
    return true;
  }
  function restoreDisabledDebtors(){
    var changed = false;
    buyers().forEach(function(c){
      if(isTemp(c)) return;
      if(restoreIfHasDebt(c)) changed = true;
    });
    if(changed && typeof tudou2SaveNow === "function") setTimeout(tudou2SaveNow, 0);
    return changed;
  }

  function patchDisableButton(){
    restoreDisabledDebtors();
    var actions = document.querySelector("#buyerManagerV47 .buyer-v47-top-actions");
    if(!actions) return;
    var buyer = selectedBuyer();
    var btn = document.getElementById("buyerDisableBtnStep1");
    if(!btn){
      btn = document.createElement("button");
      btn.id = "buyerDisableBtnStep1";
      btn.type = "button";
      actions.insertBefore(btn, actions.firstChild);
    }
    if(!buyer || isTemp(buyer)){
      btn.style.display = "none";
      return;
    }
    btn.style.display = "";
    btn.className = isDisabled(buyer) ? "buyer-v47-enable-step1" : "buyer-v47-disable-step1";
    btn.textContent = isDisabled(buyer) ? "启用买家" : "停用买家";
    btn.onclick = function(ev){
      if(ev){
        ev.preventDefault();
        ev.stopPropagation();
      }
      if(isDisabled(buyer)) enableBuyerStep1(buyer.id);
      else disableBuyerStep1(buyer.id);
      return false;
    };
  }

  function refreshAll(){
    if(typeof renderCashierCustomers === "function") renderCashierCustomers();
    if(typeof renderBuyerV47 === "function") renderBuyerV47();
    if(typeof renderCashierCustomerTabsStep1 === "function") renderCashierCustomerTabsStep1();
    if(typeof tudou2SaveNow === "function") setTimeout(tudou2SaveNow, 0);
  }

  window.disableBuyerStep1 = function(id){
    var b = buyerById(id);
    if(!b || isTemp(b)) return;
    restoreIfHasDebt(b);
    var debt = outstandingDebt(b);
    if(debt > 0.0001){
      alert("该用户有未结清账单，无法停用。请先结清欠款后再停用。");
      if(typeof renderBuyerV47 === "function") renderBuyerV47();
      return;
    }
    b.disabled = true;
    b.disabledAt = new Date().toLocaleString("zh-CN", {hour12:false});
    if(typeof toast === "function") toast("买家已停用，不会再出现在收银选择里");
    refreshAll();
  };

  window.enableBuyerStep1 = function(id){
    var b = buyerById(id);
    if(!b || isTemp(b)) return;
    b.disabled = false;
    b.disabledAt = "";
    if(typeof toast === "function") toast("买家已启用");
    refreshAll();
  };

  var oldRenderBuyerListDisableStep1 = typeof window.renderBuyerV47List === "function" ? window.renderBuyerV47List : null;
  if(oldRenderBuyerListDisableStep1 && !oldRenderBuyerListDisableStep1.__disableBuyerStep1Wrapped){
    window.renderBuyerV47List = function(){
      restoreDisabledDebtors();
      oldRenderBuyerListDisableStep1.apply(this, arguments);
      var box = document.getElementById("buyerV47List");
      if(!box) return;
      box.querySelectorAll(".buyer-v47-card").forEach(function(card){
        var name = card.querySelector("b") ? card.querySelector("b").textContent.replace(/^门店：/,"") : "";
        var b = buyers().find(function(c){ return c.name === name; });
        if(!b || !isDisabled(b)) return;
        card.classList.add("disabled-step1");
        var tag = card.querySelector(".buyer-v47-tag");
        if(tag) tag.textContent = "已停用";
      });
    };
    window.renderBuyerV47List.__disableBuyerStep1Wrapped = true;
  }

  var oldRenderBuyerDetailDisableStep1 = typeof window.renderBuyerV47Detail === "function" ? window.renderBuyerV47Detail : null;
  if(oldRenderBuyerDetailDisableStep1 && !oldRenderBuyerDetailDisableStep1.__disableBuyerStep1Wrapped){
    window.renderBuyerV47Detail = function(){
      restoreDisabledDebtors();
      var result = oldRenderBuyerDetailDisableStep1.apply(this, arguments);
      var buyer = selectedBuyer();
      if(buyer && isDisabled(buyer)){
        var sub = document.getElementById("buyerV47Sub");
        if(sub) sub.textContent = "已停用｜历史订单保留，不出现在收银买家选择中";
        var type = document.getElementById("buyerV47Type");
        if(type) type.textContent = "已停用";
      }
      patchDisableButton();
      return result;
    };
    window.renderBuyerV47Detail.__disableBuyerStep1Wrapped = true;
  }

  var oldRenderCashierCustomersDisableStep1 = typeof window.renderCashierCustomers === "function" ? window.renderCashierCustomers : null;
  window.renderCashierCustomers = function(){
    restoreDisabledDebtors();
    var sel = document.getElementById("cashierCustomer");
    if(!sel) return;
    var old = sel.value;
    var active = buyers().filter(function(c){ return !isDisabled(c); });
    if(!active.length && buyers()[0]) active = [buyers()[0]];
    sel.innerHTML = active.map(function(c){
      return '<option value="'+esc(c.id)+'">'+esc(c.name)+(Number(c.debt || 0) > 0 ? "｜欠" + money(c.debt) : "")+'</option>';
    }).join("");
    if(active.some(function(c){ return c.id === old; })) sel.value = old;
    else if(active[0]) sel.value = active[0].id;
  };
  if(oldRenderCashierCustomersDisableStep1) oldRenderCashierCustomersDisableStep1 = null;

  var oldAddBuyerV47DisableStep1 = typeof window.addBuyerV47 === "function" ? window.addBuyerV47 : null;
  window.addBuyerV47 = function(){
    var name = prompt("请输入买家名称：");
    if(!name) return;
    var clean = name.trim();
    if(!clean) return;
    var existed = buyers().find(function(c){ return c.name === clean && !isDisabled(c); });
    if(existed){
      selectedBuyerV47Id = existed.id;
      if(typeof renderBuyerV47 === "function") renderBuyerV47();
      if(typeof toast === "function") toast("买家已存在，已为你选中");
      return;
    }
    var c = {id:"c" + Date.now(), name:clean, debt:0, payments:[], parentId:"", disabled:false};
    buyers().push(c);
    selectedBuyerV47Id = c.id;
    refreshAll();
    if(typeof toast === "function") toast("买家已新增");
  };

  var oldSaveCashierAddBuyerDisableStep1 = typeof window.saveCashierAddBuyerStep1 === "function" ? window.saveCashierAddBuyerStep1 : null;
  if(oldSaveCashierAddBuyerDisableStep1 && !oldSaveCashierAddBuyerDisableStep1.__disableBuyerStep1Wrapped){
    window.saveCashierAddBuyerStep1 = function(){
      var input = document.getElementById("cashierAddBuyerNameStep1");
      var clean = String((input && input.value) || "").trim();
      if(!clean) return oldSaveCashierAddBuyerDisableStep1.apply(this, arguments);
      var existed = buyers().find(function(c){ return c.name === clean && !isDisabled(c); });
      if(!existed){
        var c = {id:"c" + Date.now(), name:clean, debt:0, payments:[], parentId:"", disabled:false};
        buyers().push(c);
        if(typeof closeCashierAddBuyerStep1 === "function") closeCashierAddBuyerStep1();
        try{ selectedBuyerV47Id = c.id; }catch(err){}
        try{ window.selectedCashierCustomerIdV116 = c.id; }catch(err){}
        try{ localStorage.setItem('CANGJIE_SELECTED_CUSTOMER_V116', c.id); }catch(err){}
        try{ window.currentBuyer = c; window.selectedBuyer = c; }catch(err){}
        if(typeof renderCashierCustomers === "function") renderCashierCustomers();
        if(typeof addCashierBillSessionStep1 === "function") addCashierBillSessionStep1(c.id, c.name);
        var sel = document.getElementById("cashierCustomer");
        if(sel){
          try{
            Array.from(sel.options || []).forEach(function(opt){ opt.selected = opt.value === c.id; });
            var targetIndex = Array.from(sel.options || []).findIndex(function(opt){ return opt.value === c.id; });
            if(targetIndex >= 0) sel.selectedIndex = targetIndex;
          }catch(err){}
          sel.value = c.id;
          try{ sel.dispatchEvent(new Event("input", {bubbles:true})); }catch(err){}
          try{ sel.dispatchEvent(new Event("change", {bubbles:true})); }catch(err){}
        }
        try{ if(typeof syncCustomerStateV116 === "function") syncCustomerStateV116(c.id); }catch(err){}
        try{
          if(typeof window.pickCashierBuyerDirectV82 === "function") window.pickCashierBuyerDirectV82(c.id);
          else if(typeof window.selectCashierBuyerTreeV82 === "function") window.selectCashierBuyerTreeV82(c.id);
        }catch(err){}
        try{ if(typeof handleCustomerOrPayChange === "function") handleCustomerOrPayChange(); }catch(err){}
        refreshAll();
        setTimeout(function(){
          try{ window.selectedCashierCustomerIdV116 = c.id; }catch(err){}
          try{ if(typeof syncCustomerStateV116 === "function") syncCustomerStateV116(c.id); }catch(err){}
          try{ window.currentBuyer = c; window.selectedBuyer = c; }catch(err){}
          try{ if(typeof window.renderCashierBuyerTreeV82 === "function") window.renderCashierBuyerTreeV82(); }catch(err){}
        }, 0);
        if(typeof toast === "function") toast("买家已新增，并已开码单");
        return;
      }
      return oldSaveCashierAddBuyerDisableStep1.apply(this, arguments);
    };
    window.saveCashierAddBuyerStep1.__disableBuyerStep1Wrapped = true;
  }

  setTimeout(function(){
    buyers().forEach(function(c){
      if(typeof c.disabled === "undefined") c.disabled = false;
    });
    if(restoreDisabledDebtors() && typeof renderBuyerV47 === "function") renderBuyerV47();
    patchDisableButton();
    if(typeof renderCashierCustomers === "function") renderCashierCustomers();
  }, 0);
})();

/* extracted script block 32 */
/* ===== Step1 owner framework: sold-out batches, expenses and settlement ===== */
(function(){
  var ownerStep1Selected = {owner:"", batchId:"", tab:"soldout"};
  var ownerFeeItemsStep1 = ["工钱","冷库费","代卖费","卸车费","运费"];
  try{
    var savedOwnerFeeItemsStep1 = JSON.parse(localStorage.getItem("tudou2_owner_fee_items_step1") || "[]");
    if(Array.isArray(savedOwnerFeeItemsStep1)){
      savedOwnerFeeItemsStep1.forEach(function(item){
        item = String(item || "").trim();
        if(item && !ownerFeeItemsStep1.includes(item)) ownerFeeItemsStep1.push(item);
      });
    }
  }catch(err){}
  var ownerFeeStep1State = {batchId:"", sign:-1, item:"工钱"};

  function n(v){ return Number(v || 0) || 0; }
  function e(v){ return typeof esc === "function" ? esc(v) : String(v ?? ""); }
  function q(v){ return String(v ?? "").replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\r?\n/g, " "); }
  function m(v){ return typeof money === "function" ? money(v) : n(v).toFixed(2); }
  function saveOwnerFeeItemsStep1(){
    try{ localStorage.setItem("tudou2_owner_fee_items_step1", JSON.stringify(ownerFeeItemsStep1)); }catch(err){}
  }
  function addOwnerFeeItemOptionStep1(name){
    var clean = String(name || "").trim();
    if(!clean) return "";
    if(!ownerFeeItemsStep1.includes(clean)){
      ownerFeeItemsStep1.push(clean);
      saveOwnerFeeItemsStep1();
    }
    return clean;
  }
  function allBatchesStep1(){ return (typeof batches !== "undefined" && Array.isArray(batches)) ? batches : []; }
  function allOrdersStep1(){ return (typeof finalOrders !== "undefined" && Array.isArray(finalOrders)) ? finalOrders : []; }
  function isSoldOutBatchStep1(b){ return !!(b && (b.soldOut || b.saleStatus === "soldout")); }
  function isSettledBatchStep1(b){ return !!(b && (b.ownerSettled || b.ownerSettlementAt)); }
  function batchNoStep1(b){ return String((b && (b.no || b.batchNo)) || ""); }
  function batchItemsStep1(b){ return Array.isArray(b && b.items) ? b.items : []; }
  function feeRowsStep1(b){
    if(!b) return [];
    if(!Array.isArray(b.ownerFees)) b.ownerFees = [];
    return b.ownerFees;
  }
  function feeEffectStep1(f){
    if(f && typeof f.effectAmount !== "undefined") return n(f.effectAmount);
    return -Math.abs(n(f && f.amount));
  }
  function signedMoneyStep1(v){
    var num = n(v);
    return (num > 0 ? "+" : "") + m(num);
  }
  function orderLinesForBatchStep1(b){
    if(!b) return [];
    var no = batchNoStep1(b);
    var owner = String(b.owner || "");
    var rows = [];
    allOrdersStep1().forEach(function(order){
      if(order && (order.voided || order.status === "已作废" || order.displayStatus === "已作废")) return;
      (order.lines || []).forEach(function(line){
        if(String(line.owner || "") !== owner) return;
        if(String(line.batchNo || "") !== no) return;
        rows.push({
          time:order.time || "",
          buyer:order.customerName || order.customer || "",
          orderNo:order.orderNo || order.billNo || "",
          name:line.name || "",
          qty:n(line.qty),
          weight:n(line.weight),
          price:n(line.price),
          amount:n(line.amount)
        });
      });
    });
    return rows;
  }
  function salesByGoodsStep1(b){
    var map = {};
    orderLinesForBatchStep1(b).forEach(function(line){
      var key = line.name || "-";
      if(!map[key]) map[key] = {qty:0, weight:0, amount:0, count:0};
      map[key].qty += line.qty;
      map[key].weight += line.weight;
      map[key].amount += line.amount;
      map[key].count += 1;
    });
    return map;
  }
  function batchSummaryStep1(b){
    var sales = salesByGoodsStep1(b);
    var inQty = 0, inWeight = 0, soldQty = 0, soldWeight = 0, saleAmount = 0;
    batchItemsStep1(b).forEach(function(item){
      var qty = n(item.qty);
      var weight = item.pack === "定装" ? qty * n(item.spec) : n(item.weight);
      var s = sales[item.name || ""] || {qty:0, weight:0, amount:0};
      inQty += qty;
      inWeight += weight;
      soldQty += s.qty;
      soldWeight += s.weight;
      saleAmount += s.amount;
    });
    var fees = feeRowsStep1(b).reduce(function(sum, fee){ return sum + feeEffectStep1(fee); }, 0);
    return {inQty:inQty,inWeight:inWeight,soldQty:soldQty,soldWeight:soldWeight,saleAmount:saleAmount,fees:fees,net:saleAmount+fees};
  }
  function ownersStep1(){
    var set = {};
    allBatchesStep1().forEach(function(b){ if(b && b.owner) set[b.owner] = true; });
    try{ (owners || []).forEach(function(o){ if(o) set[o] = true; }); }catch(err){}
    return Object.keys(set);
  }
  function batchesForOwnerStep1(owner){
    return allBatchesStep1().filter(function(b){ return b && String(b.owner || "") === String(owner || ""); });
  }
  function filteredOwnerBatchesStep1(owner){
    var rows = batchesForOwnerStep1(owner);
    if(ownerStep1Selected.tab === "soldout") rows = rows.filter(isSoldOutBatchStep1);
    if(ownerStep1Selected.tab === "selling") rows = rows.filter(function(b){ return b.confirmed && !isSoldOutBatchStep1(b) && !isSettledBatchStep1(b); });
    if(ownerStep1Selected.tab === "settled") rows = rows.filter(isSettledBatchStep1);
    return rows;
  }
  function currentOwnerBatchStep1(){
    var owner = ownerStep1Selected.owner || ownersStep1()[0] || "";
    var rows = filteredOwnerBatchesStep1(owner);
    return rows.find(function(b){ return b.id === ownerStep1Selected.batchId; }) || rows[0] || null;
  }
  function refreshOwnerStep1(){
    try{ if(typeof renderOwnerStep1 === "function") renderOwnerStep1(); }catch(err){}
    try{ if(typeof renderInventoryStep1 === "function") renderInventoryStep1(); }catch(err){}
    try{ if(typeof renderStockModule === "function") renderStockModule(); }catch(err){}
    try{ if(typeof tudou2SaveNow === "function") setTimeout(tudou2SaveNow, 0); }catch(err){}
  }

  window.ensureOwnerStep1Dom = function(){
    if(document.getElementById("ownerStep1Root")) return;
    var style = document.createElement("style");
    style.textContent = `
      #ownerStep1Root{display:none;margin-left:74px;width:calc(100vw - 74px);min-height:100vh;background:#f4f5f1;color:#1f2a22;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",Arial,sans-serif}
      .owner-step1-layout{display:grid;grid-template-columns:310px minmax(0,1fr);min-height:100vh}
      .owner-step1-side{background:#f7f8f4;border-right:1px solid #d9ddd3;padding:14px;overflow:auto}
      .owner-step1-side h1{font-size:24px;margin:0 0 10px;font-weight:950}
      .owner-step1-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px}
      .owner-step1-tabs button{height:38px;border:0;border-radius:10px;background:#e5e8e0;color:#263028;font-weight:950;cursor:pointer}
      .owner-step1-tabs button.active{background:#2f8e40;color:#fff}
      .owner-step1-card{border:2px solid #d9ddd3;background:#fff;border-radius:12px;padding:12px;margin-bottom:10px;cursor:pointer}
      .owner-step1-card.active{border-color:#2f8e40;background:#eef8ea}
      .owner-step1-card b{display:block;font-size:18px;margin-bottom:5px}.owner-step1-card span{display:block;font-size:12px;color:#617064;font-weight:850;line-height:1.55}
      .owner-step1-batch{margin-left:16px}
      .owner-step1-main{background:#fff;min-width:0;overflow:auto}
      .owner-step1-top{min-height:92px;border-bottom:1px solid #d9ddd3;padding:16px 18px;display:flex;align-items:center;justify-content:space-between;gap:12px}
      .owner-step1-top h2{margin:0;font-size:28px;font-weight:950}.owner-step1-top p{margin:6px 0 0;color:#647064;font-weight:850}
      .owner-step1-actions{display:flex;gap:10px;flex-wrap:wrap}.owner-step1-actions button,.owner-step1-actions a{height:42px;border:0;border-radius:10px;padding:0 14px;font-weight:950;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center}
      .owner-step1-green{background:#2f8e40;color:#fff}.owner-step1-gray{background:#e5e8e0;color:#263028}.owner-step1-orange{background:#d96f21;color:#fff}.owner-step1-red{background:#df4242;color:#fff}
      .owner-step1-summary{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;padding:14px 18px;background:#fbfcf8;border-bottom:1px solid #e5e8df}
      .owner-step1-stat{border:1px solid #d9ddd3;border-radius:12px;padding:12px;background:#fff}.owner-step1-stat span{display:block;font-size:12px;color:#667064;font-weight:900}.owner-step1-stat b{font-size:20px;font-weight:950}
      .owner-step1-section{padding:14px 18px}.owner-step1-section h3{margin:0 0 10px;font-size:20px;font-weight:950}
      .owner-step1-table{width:100%;min-width:940px;border-collapse:collapse;border:1px solid #d9ddd3;border-radius:12px;overflow:hidden}
      .owner-step1-table th,.owner-step1-table td{border-bottom:1px solid #e5e8df;padding:10px 9px;text-align:left;font-size:14px;font-weight:850;vertical-align:middle}
      .owner-step1-table th{background:#eef1ed;font-weight:950}.owner-step1-table tr:nth-child(even) td{background:#f8f9f5}
      .owner-step1-empty{min-height:260px;display:flex;align-items:center;justify-content:center;text-align:center;color:#6c756b;font-weight:900;line-height:1.8}
      .owner-step1-tag{display:inline-flex;border-radius:999px;padding:4px 9px;background:#e9f8ee;color:#23733b;font-size:12px;font-weight:950}.owner-step1-tag.orange{background:#f8e1d0;color:#a74d14}
      .owner-fee-step1-mask{position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;background:rgba(24,30,26,.42);padding:18px}
      .owner-fee-step1-mask.show{display:flex}
      .owner-fee-step1-dialog{width:min(560px,96vw);max-height:88vh;overflow:auto;background:#fff;border-radius:16px;box-shadow:0 18px 60px rgba(0,0,0,.22);border:1px solid #dfe4dc}
      .owner-fee-step1-head{height:62px;display:grid;grid-template-columns:90px 1fr 90px;align-items:center;border-bottom:1px solid #e4e8df;padding:0 16px}
      .owner-fee-step1-head h3{margin:0;text-align:center;font-size:18px;font-weight:950}
      .owner-fee-step1-link{border:0;background:transparent;color:#2f8e40;font-weight:950;font-size:15px;cursor:pointer}
      .owner-fee-step1-confirm{height:38px;border:0;border-radius:10px;background:#21b85b;color:#fff;font-weight:950;cursor:pointer}
      .owner-fee-step1-body{padding:18px}
      .owner-fee-step1-row{display:grid;grid-template-columns:110px minmax(0,1fr) 30px;gap:10px;align-items:center;margin-bottom:10px}
      .owner-fee-step1-signs{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      .owner-fee-step1-signs button{height:42px;border:0;border-radius:10px;background:#e9ede6;color:#263028;font-size:22px;font-weight:950;cursor:pointer}
      .owner-fee-step1-signs button.active.minus{background:#df4242;color:#fff}.owner-fee-step1-signs button.active.plus{background:#2f8e40;color:#fff}
      .owner-fee-step1-amount{height:42px;border:1px solid #d7ddd2;border-radius:10px;padding:0 12px;font-size:16px;font-weight:900;min-width:0}
      .owner-fee-step1-hint{margin:0 0 16px;color:#a45a1f;font-size:13px;font-weight:850}
      .owner-fee-step1-label{font-size:14px;font-weight:950;margin:12px 0 8px}
      .owner-fee-step1-search{width:100%;height:40px;border:1px solid #d7ddd2;border-radius:10px;padding:0 12px;font-weight:850;box-sizing:border-box}
      .owner-fee-step1-chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
      .owner-fee-step1-chip{border:0;border-radius:10px;background:#e9ede6;color:#263028;height:34px;padding:0 13px;font-weight:950;cursor:pointer}
      .owner-fee-step1-chip.active{background:#2f8e40;color:#fff}
      .owner-fee-step1-note{width:100%;min-height:82px;border:1px solid #d7ddd2;border-radius:10px;padding:10px 12px;resize:vertical;font-weight:850;box-sizing:border-box}
      .owner-fee-step1-upload{height:64px;border:2px dashed #d7ddd2;border-radius:12px;color:#8a9488;display:flex;align-items:center;justify-content:center;font-weight:900;background:#fafbf8}
      .owner-fee-step1-minus{color:#c73939;font-weight:950}.owner-fee-step1-plus{color:#25813b;font-weight:950}
      .owner-fee-inline-step1{border:1px solid #d9ddd3;background:#fbfcf8;border-radius:12px;padding:12px;margin-bottom:12px}
      .owner-fee-inline-step1 h4{margin:0 0 10px;font-size:16px;font-weight:950}
      .owner-fee-inline-grid-step1{display:grid;grid-template-columns:120px 180px minmax(120px,1fr) 110px;gap:8px;align-items:center}
      .owner-fee-inline-grid-step1 select,.owner-fee-inline-grid-step1 input{height:38px;border:1px solid #d7ddd2;border-radius:9px;padding:0 10px;font-weight:850;min-width:0;background:#fff}
      .owner-fee-inline-grid-step1 button{height:38px;border:0;border-radius:9px;background:#d96f21;color:#fff;font-weight:950;cursor:pointer}
      .owner-fee-inline-grid-step1 .owner-fee-inline-add-btn-step1{background:#2f8e40;color:#fff}
      #ownerFeeInlineCustomStep1{grid-column:1 / span 2;max-width:260px}
      .owner-fee-inline-add-btn-step1{grid-column:3;width:96px}
      .owner-fee-inline-remark-step1{margin-top:8px;width:100%;height:42px;border:1px solid #d7ddd2;border-radius:9px;padding:0 10px;font-weight:850;box-sizing:border-box}
      @media(max-width:980px){#ownerStep1Root{margin-left:0;margin-top:58px;width:100vw}.owner-step1-layout{grid-template-columns:1fr}.owner-step1-summary{grid-template-columns:1fr 1fr}.owner-step1-top{display:block}.owner-step1-actions{margin-top:10px}}
      @media(max-width:980px){.owner-fee-inline-grid-step1{grid-template-columns:1fr 1fr}.owner-fee-inline-grid-step1 button{grid-column:auto}#ownerFeeInlineCustomStep1{grid-column:1 / -1;max-width:none}.owner-fee-inline-add-btn-step1{grid-column:1 / -1;width:auto}}
    `;
    document.head.appendChild(style);
    var root = document.createElement("div");
    root.id = "ownerStep1Root";
    root.innerHTML = '<div class="owner-step1-layout"><aside class="owner-step1-side"><h1>货主</h1><div class="owner-step1-tabs"><button data-tab="selling" onclick="setOwnerStep1Tab(\'selling\')">在售</button><button data-tab="soldout" onclick="setOwnerStep1Tab(\'soldout\')">售完</button><button data-tab="settled" onclick="setOwnerStep1Tab(\'settled\')">已结算</button></div><div id="ownerStep1List"></div></aside><main class="owner-step1-main"><header class="owner-step1-top"><div><h2 id="ownerStep1Title">货主框架</h2><p id="ownerStep1Sub">连接售完批次、订单销售明细和售卖中费用。</p></div><div class="owner-step1-actions" id="ownerStep1Actions"></div></header><section class="owner-step1-summary" id="ownerStep1Summary"></section><section class="owner-step1-section"><h3>销售商品明细</h3><div id="ownerStep1Goods"></div></section><section class="owner-step1-section"><h3>销售流水</h3><div id="ownerStep1Orders"></div></section><section class="owner-step1-section"><h3>售卖中费用</h3><div id="ownerStep1Fees"></div></section></main></div>';
    document.body.appendChild(root);
  };

  function ensureOwnerFeeStep1Dom(){
    ensureOwnerStep1Dom();
    if(document.getElementById("ownerFeeStep1Mask")) return;
    var mask = document.createElement("div");
    mask.id = "ownerFeeStep1Mask";
    mask.className = "owner-fee-step1-mask";
    mask.innerHTML = '<div class="owner-fee-step1-dialog"><div class="owner-fee-step1-head"><button class="owner-fee-step1-link" onclick="closeOwnerFeeStep1()">取消</button><h3>新增货主费用</h3><button class="owner-fee-step1-confirm" onclick="saveOwnerFeeStep1()">确定</button></div><div class="owner-fee-step1-body"><div class="owner-fee-step1-row"><div class="owner-fee-step1-signs"><button id="ownerFeeMinusStep1" class="minus" onclick="setOwnerFeeSignStep1(-1)">-</button><button id="ownerFeePlusStep1" class="plus" onclick="setOwnerFeeSignStep1(1)">+</button></div><input id="ownerFeeAmountStep1" class="owner-fee-step1-amount" type="number" min="0" step="0.01" placeholder="请输入金额"><b>元</b></div><p class="owner-fee-step1-hint">- 应付货款减少；+ 应付货款增加。</p><div class="owner-fee-step1-label">费用项</div><input id="ownerFeeSearchStep1" class="owner-fee-step1-search" placeholder="搜索费用项" oninput="renderOwnerFeeItemsStep1()"><div id="ownerFeeItemsStep1" class="owner-fee-step1-chips"></div><div class="owner-fee-step1-label">备注</div><textarea id="ownerFeeRemarkStep1" class="owner-fee-step1-note" maxlength="80" placeholder="请输入费用备注"></textarea><div class="owner-fee-step1-label">上传图片</div><div class="owner-fee-step1-upload">后续可接入拍照上传</div></div></div>';
    mask.addEventListener("click", function(evt){
      if(evt.target === mask) closeOwnerFeeStep1();
    });
    document.body.appendChild(mask);
  }

  function openOwnerFeeStep1(batchId){
    var b = allBatchesStep1().find(function(x){ return String(x && x.id) === String(batchId || ""); }) || currentOwnerBatchStep1();
    if(!b){
      alert("请先选择一个货主批次。");
      return;
    }
    ensureOwnerFeeStep1Dom();
    ownerFeeStep1State = {batchId:b.id, sign:-1, item:ownerFeeItemsStep1[0] || "售卖中费用"};
    document.getElementById("ownerFeeAmountStep1").value = "";
    document.getElementById("ownerFeeSearchStep1").value = "";
    document.getElementById("ownerFeeRemarkStep1").value = "";
    setOwnerFeeSignStep1(-1);
    renderOwnerFeeItemsStep1();
    document.getElementById("ownerFeeStep1Mask").classList.add("show");
    setTimeout(function(){
      var input = document.getElementById("ownerFeeAmountStep1");
      if(input) input.focus();
    }, 0);
  }

  window.closeOwnerFeeStep1 = function(){
    var mask = document.getElementById("ownerFeeStep1Mask");
    if(mask) mask.classList.remove("show");
  };
  window.setOwnerFeeSignStep1 = function(sign){
    ownerFeeStep1State.sign = sign === 1 ? 1 : -1;
    var minus = document.getElementById("ownerFeeMinusStep1");
    var plus = document.getElementById("ownerFeePlusStep1");
    if(minus) minus.classList.toggle("active", ownerFeeStep1State.sign < 0);
    if(plus) plus.classList.toggle("active", ownerFeeStep1State.sign > 0);
  };
  window.selectOwnerFeeItemStep1 = function(item){
    ownerFeeStep1State.item = addOwnerFeeItemOptionStep1(item) || "售卖中费用";
    renderOwnerFeeItemsStep1();
  };
  window.renderOwnerFeeItemsStep1 = function(){
    var box = document.getElementById("ownerFeeItemsStep1");
    if(!box) return;
    var kw = (document.getElementById("ownerFeeSearchStep1")?.value || "").trim();
    var rows = ownerFeeItemsStep1.filter(function(item){ return !kw || item.indexOf(kw) !== -1; });
    if(kw && !rows.includes(kw)) rows.push(kw);
    box.innerHTML = rows.map(function(item){
      return '<button class="owner-fee-step1-chip '+(ownerFeeStep1State.item === item ? "active" : "")+'" onclick="selectOwnerFeeItemStep1(\''+q(item)+'\')">'+e(item)+'</button>';
    }).join("") || '<button class="owner-fee-step1-chip active" onclick="selectOwnerFeeItemStep1(\'售卖中费用\')">售卖中费用</button>';
  };
  window.saveOwnerFeeStep1 = function(){
    var b = allBatchesStep1().find(function(x){ return String(x && x.id) === String(ownerFeeStep1State.batchId || ""); }) || currentOwnerBatchStep1();
    if(!b){
      alert("请先选择一个货主批次。");
      return;
    }
    var amountInput = document.getElementById("ownerFeeAmountStep1");
    var remarkInput = document.getElementById("ownerFeeRemarkStep1");
    var amount = Math.abs(n(amountInput && amountInput.value));
    if(amount <= 0){
      alert("请输入费用金额。");
      if(amountInput) amountInput.focus();
      return;
    }
    var effect = ownerFeeStep1State.sign * amount;
    var feeName = addOwnerFeeItemOptionStep1(ownerFeeStep1State.item) || "售卖中费用";
    feeRowsStep1(b).push({
      id:"of" + Date.now(),
      name:feeName,
      amount:amount,
      effectAmount:effect,
      direction:effect < 0 ? "minus" : "plus",
      time:new Date().toLocaleString("zh-CN",{hour12:false}),
      remark:(remarkInput && remarkInput.value || "").trim()
    });
    closeOwnerFeeStep1();
    if(typeof toast === "function") toast("费用已添加");
    refreshOwnerStep1();
  };
  window.quickAddOwnerFeeStep1 = function(batchId){
    var b = allBatchesStep1().find(function(x){ return String(x && x.id) === String(batchId || ""); }) || currentOwnerBatchStep1();
    if(!b){
      alert("请先选择一个货主批次。");
      return;
    }
    var signEl = document.getElementById("ownerFeeInlineSignStep1");
    var itemEl = document.getElementById("ownerFeeInlineItemStep1");
    var customEl = document.getElementById("ownerFeeInlineCustomStep1");
    var amountEl = document.getElementById("ownerFeeInlineAmountStep1");
    var remarkEl = document.getElementById("ownerFeeInlineRemarkStep1");
    var amount = Math.abs(n(amountEl && amountEl.value));
    if(amount <= 0){
      alert("请输入费用金额。");
      if(amountEl) amountEl.focus();
      return;
    }
    var itemName = addOwnerFeeItemOptionStep1((customEl && customEl.value.trim()) || (itemEl && itemEl.value) || "售卖中费用");
    var sign = signEl && signEl.value === "plus" ? 1 : -1;
    var effect = sign * amount;
    feeRowsStep1(b).push({
      id:"of" + Date.now(),
      name:itemName,
      amount:amount,
      effectAmount:effect,
      direction:effect < 0 ? "minus" : "plus",
      time:new Date().toLocaleString("zh-CN",{hour12:false}),
      remark:(remarkEl && remarkEl.value || "").trim()
    });
    if(amountEl) amountEl.value = "";
    if(customEl) customEl.value = "";
    if(remarkEl) remarkEl.value = "";
    if(typeof toast === "function") toast("费用已添加");
    refreshOwnerStep1();
  };
  window.addOwnerFeeInlineItemStep1 = function(){
    var customEl = document.getElementById("ownerFeeInlineCustomStep1");
    var itemEl = document.getElementById("ownerFeeInlineItemStep1");
    var clean = addOwnerFeeItemOptionStep1(customEl && customEl.value);
    if(!clean){
      alert("请输入新费用项名称。");
      if(customEl) customEl.focus();
      return;
    }
    if(itemEl){
      itemEl.innerHTML = ownerFeeItemsStep1.map(function(item){ return '<option value="'+e(item)+'">'+e(item)+'</option>'; }).join("");
      itemEl.value = clean;
    }
    if(customEl) customEl.value = "";
    if(typeof toast === "function") toast("费用项已添加，可在下拉里选择");
  };

  window.setOwnerStep1Tab = function(tab){
    ownerStep1Selected.tab = tab || "soldout";
    ownerStep1Selected.batchId = "";
    renderOwnerStep1();
  };
  window.selectOwnerStep1 = function(owner){
    ownerStep1Selected.owner = owner;
    ownerStep1Selected.batchId = "";
    renderOwnerStep1();
  };
  window.selectOwnerBatchStep1 = function(batchId){
    ownerStep1Selected.batchId = batchId;
    renderOwnerStep1();
  };
  window.addOwnerBatchFeeStep1 = function(batchId){
    openOwnerFeeStep1(batchId);
  };
  if(!document.__ownerFeeStep1ClickBound){
    document.__ownerFeeStep1ClickBound = true;
    document.addEventListener("click", function(evt){
      var node = evt.target && evt.target.nodeType === 1 ? evt.target : evt.target && evt.target.parentElement;
      var btn = node && node.closest ? node.closest("[data-owner-fee-batch]") : null;
      if(!btn) return;
      evt.preventDefault();
      openOwnerFeeStep1(btn.getAttribute("data-owner-fee-batch") || "");
    });
  }
  window.settleOwnerBatchStep1 = function(batchId){
    var b = allBatchesStep1().find(function(x){ return x.id === batchId; });
    if(!b) return;
    if(!confirm("确认结算该货主批次？结算后会进入已结算列表，销售与费用记录保留。")) return;
    b.ownerSettled = true;
    b.ownerSettlementAt = new Date().toLocaleString("zh-CN",{hour12:false});
    b.soldOut = true;
    b.saleStatus = "soldout";
    if(!b.soldOutAt) b.soldOutAt = b.ownerSettlementAt;
    if(typeof toast === "function") toast("货主批次已结算");
    ownerStep1Selected.tab = "settled";
    ownerStep1Selected.batchId = b.id;
    refreshOwnerStep1();
  };

  window.renderOwnerStep1 = function(){
    ensureOwnerStep1Dom();
    var ownerList = ownersStep1();
    if(!ownerStep1Selected.owner || !ownerList.includes(ownerStep1Selected.owner)) ownerStep1Selected.owner = ownerList[0] || "";
    document.querySelectorAll(".owner-step1-tabs button").forEach(function(btn){ btn.classList.toggle("active", btn.dataset.tab === ownerStep1Selected.tab); });
    var side = document.getElementById("ownerStep1List");
    var html = "";
    ownerList.forEach(function(owner){
      var ownerBatches = filteredOwnerBatchesStep1(owner);
      html += '<div class="owner-step1-card '+(ownerStep1Selected.owner===owner ? "active" : "")+'" onclick="selectOwnerStep1(\''+e(owner)+'\')"><b>'+e(owner)+'</b><span>'+ownerBatches.length+' 个批次｜'+batchesForOwnerStep1(owner).length+' 个总批次</span></div>';
      if(ownerStep1Selected.owner === owner){
        ownerBatches.forEach(function(b){
          var s = batchSummaryStep1(b);
          html += '<div class="owner-step1-card owner-step1-batch '+(ownerStep1Selected.batchId===b.id ? "active" : "")+'" onclick="selectOwnerBatchStep1(\''+e(b.id)+'\')"><b>批次 '+e(batchNoStep1(b))+'</b><span>'+e(b.tag || "")+'｜销售 '+m(s.saleAmount)+'｜费用 '+signedMoneyStep1(s.fees)+'</span><span>'+(isSettledBatchStep1(b) ? "已结算" : isSoldOutBatchStep1(b) ? "已售完" : "在售")+'</span></div>';
        });
      }
    });
    side.innerHTML = html || '<div class="owner-step1-empty">暂无货主。</div>';

    var b = currentOwnerBatchStep1();
    if(b && !ownerStep1Selected.batchId) ownerStep1Selected.batchId = b.id;
    var title = document.getElementById("ownerStep1Title");
    var sub = document.getElementById("ownerStep1Sub");
    var actions = document.getElementById("ownerStep1Actions");
    var summary = document.getElementById("ownerStep1Summary");
    var goodsBox = document.getElementById("ownerStep1Goods");
    var ordersBox = document.getElementById("ownerStep1Orders");
    var feesBox = document.getElementById("ownerStep1Fees");
    if(!b){
      title.textContent = ownerStep1Selected.owner || "货主框架";
      sub.textContent = "当前筛选下暂无批次。售完批次会在这里承接结算与费用。";
      actions.innerHTML = "";
      summary.innerHTML = "";
      goodsBox.innerHTML = ordersBox.innerHTML = feesBox.innerHTML = '<div class="owner-step1-empty">暂无可查看批次。</div>';
      return;
    }
    var totals = batchSummaryStep1(b);
    title.textContent = (b.owner || "-") + "｜" + batchNoStep1(b);
    sub.textContent = (isSettledBatchStep1(b) ? "已结算" : isSoldOutBatchStep1(b) ? "已售完" : "在售") + "｜连接订单、批次和费用";
    actions.innerHTML = '<button class="owner-step1-gray" onclick="showAppPage(\'inventoryStep1\')">返回库存</button><a class="owner-step1-orange" href="#ownerFeeInlineStep1">添加费用</a>' + (isSettledBatchStep1(b) ? '<button class="owner-step1-gray" disabled>已结算</button>' : '<button class="owner-step1-red" onclick="settleOwnerBatchStep1(\''+e(b.id)+'\')">结算</button>');
    summary.innerHTML = [
      ["入库数量", totals.inQty],
      ["入库重量", totals.inWeight + "斤"],
      ["已售数量", totals.soldQty],
      ["已售重量", totals.soldWeight + "斤"],
      ["销售货款", m(totals.saleAmount)],
      ["费用调整", signedMoneyStep1(totals.fees)],
      ["暂估应结", m(totals.net)],
      ["状态", isSettledBatchStep1(b) ? "已结算" : isSoldOutBatchStep1(b) ? "已售完" : "在售"]
    ].map(function(x){ return '<div class="owner-step1-stat"><span>'+x[0]+'</span><b>'+x[1]+'</b></div>'; }).join("");
    var sales = salesByGoodsStep1(b);
    goodsBox.innerHTML = '<table class="owner-step1-table"><thead><tr><th>货品</th><th>入库</th><th>销售</th><th>均价</th><th>销售货款</th><th>库存</th></tr></thead><tbody>' + batchItemsStep1(b).map(function(item){
      var qty = n(item.qty);
      var inWeight = item.pack === "定装" ? qty * n(item.spec) : n(item.weight);
      var s = sales[item.name || ""] || {qty:0, weight:0, amount:0};
      var avg = s.weight ? s.amount / s.weight : (s.qty ? s.amount / s.qty : 0);
      var remainQty = qty - s.qty;
      var remainWeight = inWeight - s.weight;
      return '<tr><td><b>'+e(item.name)+'</b><span class="owner-step1-tag '+(item.pack==="定装" ? "" : "orange")+'">'+e(item.pack || "")+'</span></td><td>'+qty+'件<br>'+inWeight+'斤</td><td>'+s.qty+'件<br>'+s.weight+'斤</td><td>'+m(avg)+'</td><td>'+m(s.amount)+'</td><td>'+remainQty+'件<br>'+remainWeight+'斤</td></tr>';
    }).join("") + '</tbody></table>';
    var orderRows = orderLinesForBatchStep1(b);
    ordersBox.innerHTML = '<table class="owner-step1-table"><thead><tr><th>时间</th><th>买家</th><th>订单</th><th>商品</th><th>数量</th><th>重量</th><th>金额</th></tr></thead><tbody>' + (orderRows.map(function(o){
      return '<tr><td>'+e(o.time)+'</td><td>'+e(o.buyer)+'</td><td>'+e(o.orderNo)+'</td><td>'+e(o.name)+'</td><td>'+o.qty+'</td><td>'+o.weight+'斤</td><td>'+m(o.amount)+'</td></tr>';
    }).join("") || '<tr><td colspan="7">暂无订单销售记录。</td></tr>') + '</tbody></table>';
    var fees = feeRowsStep1(b);
    var feeForm = '<div class="owner-fee-inline-step1" id="ownerFeeInlineStep1"><h4>新增货主费用</h4><div class="owner-fee-inline-grid-step1"><select id="ownerFeeInlineSignStep1"><option value="minus">- 应付减少</option><option value="plus">+ 应付增加</option></select><select id="ownerFeeInlineItemStep1">'+ownerFeeItemsStep1.map(function(item){ return '<option value="'+e(item)+'">'+e(item)+'</option>'; }).join("")+'</select><input id="ownerFeeInlineAmountStep1" type="number" min="0" step="0.01" placeholder="金额 / 元"><button type="button" onclick="quickAddOwnerFeeStep1(\''+e(b.id)+'\')">保存费用</button><input id="ownerFeeInlineCustomStep1" placeholder="输入新费用项"><button class="owner-fee-inline-add-btn-step1" type="button" onclick="addOwnerFeeInlineItemStep1()">新增选项</button></div><input id="ownerFeeInlineRemarkStep1" class="owner-fee-inline-remark-step1" placeholder="费用备注，可不填"></div>';
    feesBox.innerHTML = feeForm + '<table class="owner-step1-table"><thead><tr><th>费用项</th><th>方向</th><th>金额</th><th>影响应付</th><th>时间</th><th>备注</th></tr></thead><tbody>' + (fees.map(function(f){
      var effect = feeEffectStep1(f);
      var isPlus = effect > 0;
      return '<tr><td>'+e(f.name)+'</td><td><span class="owner-step1-tag '+(isPlus ? "" : "orange")+'">'+(isPlus ? "增加" : "减少")+'</span></td><td>'+m(Math.abs(n(f.amount || effect)))+'</td><td class="'+(isPlus ? "owner-fee-step1-plus" : "owner-fee-step1-minus")+'">'+signedMoneyStep1(effect)+'</td><td>'+e(f.time)+'</td><td>'+e(f.remark || "")+'</td></tr>';
    }).join("") || '<tr><td colspan="6">暂无售卖中费用。</td></tr>') + '</tbody></table>';
  };
})();

/* extracted script block 33 */
/* ===== Step1 final cashier guard: sold-out or settled batches never show in cashier ===== */
(function(){
  function allCashierGuardBatchesStep1(){
    return (typeof batches !== "undefined" && Array.isArray(batches)) ? batches : [];
  }
  function isClosedForCashierStep1(b){
    return !!(b && (
      b.saleStopped || b.salePaused || b.soldOut || b.settled || b.closed ||
      b.ownerSettled || b.ownerSettlementAt ||
      b.saleStatus === "stopped" || b.saleStatus === "soldout" || b.saleStatus === "settled"
    ));
  }
  function isOpenForCashierStep1(b){
    return !!(b && b.confirmed === true && !isClosedForCashierStep1(b));
  }
  function isItemOpenForCashierStep1(item, b){
    return isOpenForCashierStep1(b) && !(item && (
      item.saleStopped || item.salePaused || item.settled || item.closed ||
      item.saleStatus === "stopped" || item.saleStatus === "soldout" || item.saleStatus === "settled"
    ));
  }
  window.isBatchOpenForCashierStep1 = isOpenForCashierStep1;
  window.isItemOpenForCashierStep1 = isItemOpenForCashierStep1;
  window.openCashierBatchesStep1 = function(){
    return allCashierGuardBatchesStep1().filter(isOpenForCashierStep1);
  };

  var oldGetCashierProductsFinalStep1 = typeof window.getCashierProducts === "function" ? window.getCashierProducts : null;
  if(oldGetCashierProductsFinalStep1 && !oldGetCashierProductsFinalStep1.__soldSettledFinalStep1){
    window.getCashierProducts = function(skipLetterFilter){
      if(typeof cashierSelectedBatch !== "undefined"){
        var selected = allCashierGuardBatchesStep1().find(function(b){ return b && b.id === cashierSelectedBatch; });
        if(selected && !isOpenForCashierStep1(selected)) cashierSelectedBatch = "";
      }
      return oldGetCashierProductsFinalStep1.call(this, skipLetterFilter).filter(function(g){
        if(!g || !g.batchId) return true;
        var b = allCashierGuardBatchesStep1().find(function(x){ return x && x.id === g.batchId; });
        return isItemOpenForCashierStep1(g.relatedBatch || g.item, b);
      });
    };
    window.getCashierProducts.__soldSettledFinalStep1 = true;
  }

  window.renderCashierBatches = function(){
    var allBtn = document.getElementById("cashierAllBatchesBtn");
    if(allBtn) allBtn.classList.toggle("active", !cashierSelectedBatch);
    var box = document.getElementById("cashierBatchList");
    if(!box) return;
    var open = window.openCashierBatchesStep1();
    if(typeof cashierSelectedBatch !== "undefined"){
      var selected = allCashierGuardBatchesStep1().find(function(b){ return b && b.id === cashierSelectedBatch; });
      if(selected && !isOpenForCashierStep1(selected)) cashierSelectedBatch = "";
    }
    box.innerHTML = open.map(function(b){
      return '<div class="cashier-batch-card '+(cashierSelectedBatch===b.id ? 'active' : '')+'" onclick="selectCashierBatch(\''+esc(b.id)+'\')"><b>'+esc(b.owner || "")+'</b><span>'+esc(b.no || b.batchNo || "")+'｜'+esc(b.tag || b.type || "")+'</span></div>';
    }).join("") || '<div class="order-empty">暂无可售批次。<br>已售完或已结算批次不会显示在收银台。</div>';
  };

  var oldSelectCashierBatchFinalStep1 = typeof window.selectCashierBatch === "function" ? window.selectCashierBatch : null;
  if(oldSelectCashierBatchFinalStep1 && !oldSelectCashierBatchFinalStep1.__soldSettledFinalStep1){
    window.selectCashierBatch = function(id){
      var b = allCashierGuardBatchesStep1().find(function(x){ return x && x.id === id; });
      if(b && !isOpenForCashierStep1(b)){
        cashierSelectedBatch = "";
        if(typeof toast === "function") toast("该批次已售完或已结算，不再进入收银台");
        window.renderCashierBatches();
        if(typeof renderCashierProducts === "function") renderCashierProducts();
        return;
      }
      return oldSelectCashierBatchFinalStep1.apply(this, arguments);
    };
    window.selectCashierBatch.__soldSettledFinalStep1 = true;
  }

  var oldAddProductFinalStep1 = typeof window.addProductToCodeBill === "function" ? window.addProductToCodeBill : null;
  if(oldAddProductFinalStep1 && !oldAddProductFinalStep1.__soldSettledFinalStep1){
    window.addProductToCodeBill = function(goodsId, selectedBatchId){
      if(selectedBatchId){
        var b = allCashierGuardBatchesStep1().find(function(x){ return x && x.id === selectedBatchId; });
        var item = b ? (b.items || []).find(function(i){ return i && i.goodsId === goodsId; }) : null;
        if(!isItemOpenForCashierStep1(item, b)){
          if(typeof toast === "function") toast("该批次已售完或已结算，不能开单");
          return;
        }
      }
      return oldAddProductFinalStep1.apply(this, arguments);
    };
    window.addProductToCodeBill.__soldSettledFinalStep1 = true;
  }
})();

/* extracted script block 34 */
/* ===== Step1 reports: self-owned profit and consignment settlement ===== */
(function(){
  function nReportStep1(v){ return Number(v || 0) || 0; }
  function eReportStep1(v){ return typeof esc === "function" ? esc(v) : String(v ?? "").replace(/[&<>"']/g, function(m){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]; }); }
  function mReportStep1(v){ return typeof money === "function" ? money(v) : nReportStep1(v).toFixed(2); }
  function batchesReportStep1(){ return (typeof batches !== "undefined" && Array.isArray(batches)) ? batches : []; }
  function ordersReportStep1(){
    var rows = (typeof finalOrders !== "undefined" && Array.isArray(finalOrders)) ? finalOrders : [];
    if(typeof window.cangjieFilterOrdersForCurrentAccountV94 === "function") return window.cangjieFilterOrdersForCurrentAccountV94(rows);
    return rows;
  }
  function itemsReportStep1(b){ return Array.isArray(b && b.items) ? b.items : []; }
  function batchNoReportStep1(b){ return String((b && (b.no || b.batchNo)) || ""); }
  function isSelfBatchReportStep1(b){ return String((b && (b.tag || b.type)) || "自营") !== "代卖"; }
  function isSoldDoneReportStep1(b){ return !!(b && (b.soldOut || b.saleStatus === "soldout" || b.ownerSettled || b.ownerSettlementAt)); }
  function dateValueReportStep1(v){
    var s = String(v || "").trim();
    if(!s) return 0;
    var d = new Date(s.replace(/\//g, "-"));
    var t = d.getTime();
    return Number.isNaN(t) ? 0 : t;
  }
  function dateKeyReportStep1(v){
    var t = dateValueReportStep1(v);
    if(!t) return "";
    var d = new Date(t);
    var mm = String(d.getMonth() + 1).padStart(2, "0");
    var dd = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + mm + "-" + dd;
  }
  function inDateRangeReportStep1(dateText, start, end){
    var key = dateKeyReportStep1(dateText);
    if(!key) return true;
    if(start && key < start) return false;
    if(end && key > end) return false;
    return true;
  }
  function orderLinesForBatchReportStep1(b){
    var owner = String(b && b.owner || "");
    var no = batchNoReportStep1(b);
    var rows = [];
    ordersReportStep1().forEach(function(order){
      if(order && (order.voided || order.status === "已作废" || order.displayStatus === "已作废")) return;
      (order.lines || []).forEach(function(line){
        if(String(line.owner || "") !== owner) return;
        if(String(line.batchNo || "") !== no) return;
        rows.push({order:order,line:line});
      });
    });
    return rows;
  }
  function salesAmountReportStep1(b, start, end){
    var amount = 0, qty = 0, weight = 0, latestTime = "";
    orderLinesForBatchReportStep1(b).forEach(function(row){
      if(!inDateRangeReportStep1(row.order.time || row.order.editedAt || "", start, end)) return;
      amount += nReportStep1(row.line.amount);
      qty += nReportStep1(row.line.qty);
      weight += nReportStep1(row.line.weight);
      if(String(row.order.time || "") > String(latestTime || "")) latestTime = row.order.time || "";
    });
    return {amount:amount, qty:qty, weight:weight, latestTime:latestTime};
  }
  function purchaseCostReportStep1(b){
    return itemsReportStep1(b).reduce(function(sum, item){
      var qty = nReportStep1(item.qty);
      var weight = item.pack === "定装" ? qty * nReportStep1(item.spec) : nReportStep1(item.weight);
      var price = nReportStep1(item.purchasePrice);
      return sum + (item.pack === "定装" ? qty * price : weight * price);
    }, 0);
  }
  function batchFeeBaseReportStep1(b){
    var fee = nReportStep1(b && b.fee);
    (Array.isArray(b && b.ownerFees) ? b.ownerFees : []).forEach(function(f){
      if(typeof f.effectAmount !== "undefined") fee += Math.abs(nReportStep1(f.effectAmount));
      else fee += Math.abs(nReportStep1(f.amount));
    });
    return fee;
  }
  function consignmentFeeEffectReportStep1(b){
    return (Array.isArray(b && b.ownerFees) ? b.ownerFees : []).reduce(function(sum, f){
      if(typeof f.effectAmount !== "undefined") return sum + nReportStep1(f.effectAmount);
      return sum - Math.abs(nReportStep1(f.amount));
    }, 0);
  }
  function reportDateForBatchStep1(b, sales){
    return b.ownerSettlementAt || b.soldOutAt || b.inboundConfirmedAt || sales.latestTime || "";
  }
  function defaultMonthStartReportStep1(){
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-01";
  }
  function defaultMonthEndReportStep1(){
    var d = new Date();
    var last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return last.getFullYear() + "-" + String(last.getMonth() + 1).padStart(2, "0") + "-" + String(last.getDate()).padStart(2, "0");
  }

  window.ensureReportsStep1Dom = function(){
    if(document.getElementById("reportsStep1Root")) return;
    var style = document.createElement("style");
    style.textContent = `
      #reportsStep1Root{display:none;margin-left:74px;width:calc(100vw - 74px);min-height:100vh;background:#f4f5f1;color:#1f2a22;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",Arial,sans-serif}
      .reports-step1-top{min-height:82px;border-bottom:1px solid #d9ddd3;background:#fbfcf8;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;gap:12px}
      .reports-step1-top h1{margin:0;font-size:28px;font-weight:950}.reports-step1-top p{margin:5px 0 0;color:#657066;font-weight:850}
      .reports-step1-filters{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.reports-step1-filters input,.reports-step1-filters button{height:40px;border-radius:10px;font-weight:900}.reports-step1-filters input{border:1px solid #cfd6cb;padding:0 10px;background:#fff}.reports-step1-filters button{border:0;background:#2f8e40;color:#fff;padding:0 14px;cursor:pointer}
      .reports-step1-tabs{display:flex;gap:8px;padding:12px 18px;background:#fff;border-bottom:1px solid #e5e8df}.reports-step1-tabs button{height:40px;border:0;border-radius:10px;background:#e5e8e0;color:#263028;padding:0 16px;font-weight:950;cursor:pointer}.reports-step1-tabs button.active{background:#2f8e40;color:#fff}
      .reports-step1-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;padding:14px 18px}.reports-step1-card{background:#fff;border:1px solid #d9ddd3;border-radius:12px;padding:12px}.reports-step1-card span{display:block;font-size:12px;color:#657066;font-weight:950}.reports-step1-card b{font-size:22px;font-weight:950}
      .reports-step1-section{padding:0 18px 18px}.reports-step1-section h2{font-size:21px;margin:8px 0 10px;font-weight:950}
      .reports-step1-table-wrap{overflow:auto;background:#fff;border:1px solid #d9ddd3;border-radius:12px}.reports-step1-table{width:100%;min-width:1050px;border-collapse:collapse}.reports-step1-table th,.reports-step1-table td{border-bottom:1px solid #e5e8df;padding:10px 9px;text-align:left;font-size:14px;font-weight:850}.reports-step1-table th{background:#eef1ed;font-weight:950}.reports-step1-table tr:last-child td{border-bottom:0}
      .reports-step1-profit{color:#23733b}.reports-step1-loss{color:#c33a3a}.reports-step1-tag{display:inline-flex;border-radius:999px;padding:4px 9px;background:#e9f8ee;color:#23733b;font-size:12px;font-weight:950}.reports-step1-tag.orange{background:#f8e1d0;color:#a74d14}.reports-step1-empty{min-height:180px;display:flex;align-items:center;justify-content:center;text-align:center;color:#687268;font-weight:900;line-height:1.7}
      @media(max-width:980px){#reportsStep1Root{margin-left:0;margin-top:58px;width:100vw}.reports-step1-top{display:block}.reports-step1-filters{margin-top:10px}.reports-step1-summary{grid-template-columns:1fr 1fr}}
    `;
    document.head.appendChild(style);
    var root = document.createElement("div");
    root.id = "reportsStep1Root";
    root.innerHTML = '<header class="reports-step1-top"><div><h1>报表</h1><p>区分自营利润和代卖货主结算，连接批次、订单和费用。</p></div><div class="reports-step1-filters"><input id="reportsStep1Start" type="date"><span>至</span><input id="reportsStep1End" type="date"><button type="button" onclick="renderReportsStep1()">查询</button></div></header><div class="reports-step1-tabs"><button id="reportsSelfTabStep1" type="button" onclick="setReportsStep1Tab(\'self\')">自营利润</button><button id="reportsConsignTabStep1" type="button" onclick="setReportsStep1Tab(\'consign\')">代卖结算</button><button id="reportsEmployeeTabStep1" type="button" onclick="setReportsStep1Tab(\'employee\')">员工销售汇总</button></div><section class="reports-step1-summary" id="reportsStep1Summary"></section><section class="reports-step1-section"><h2 id="reportsStep1TableTitle">自营批次利润汇总</h2><div id="reportsStep1Table"></div></section>';
    document.body.appendChild(root);
    document.getElementById("reportsStep1Start").value = defaultMonthStartReportStep1();
    document.getElementById("reportsStep1End").value = defaultMonthEndReportStep1();
  };

  var reportsTabStep1 = "self";
  window.setReportsStep1Tab = function(tab){
    reportsTabStep1 = tab === "consign" ? "consign" : (tab === "employee" ? "employee" : "self");
    renderReportsStep1();
  };

  window.renderReportsStep1 = function(){
    ensureReportsStep1Dom();
    var start = document.getElementById("reportsStep1Start").value || "";
    var end = document.getElementById("reportsStep1End").value || "";
    document.getElementById("reportsSelfTabStep1").classList.toggle("active", reportsTabStep1 === "self");
    document.getElementById("reportsConsignTabStep1").classList.toggle("active", reportsTabStep1 === "consign");
    var employeeTab = document.getElementById("reportsEmployeeTabStep1");
    if(employeeTab) employeeTab.classList.toggle("active", reportsTabStep1 === "employee");
    if(reportsTabStep1 === "employee"){
      var reportOrders = ordersReportStep1().filter(function(order){
        if(order && (order.voided || order.status === "已作废" || order.displayStatus === "已作废")) return false;
        return inDateRangeReportStep1(order.time || order.createdAt || order.editedAt || "", start, end);
      });
      var summaryRows = typeof window.cangjieEmployeeSalesSummaryV94 === "function" ? window.cangjieEmployeeSalesSummaryV94(reportOrders) : [];
      var salesTotal = summaryRows.reduce(function(s,r){ return s + nReportStep1(r.salesAmount); }, 0);
      var paidTotal = summaryRows.reduce(function(s,r){ return s + nReportStep1(r.paidAmount); }, 0);
      var debtTotal = summaryRows.reduce(function(s,r){ return s + nReportStep1(r.debtAmount); }, 0);
      var cashTotal = summaryRows.reduce(function(s,r){ return s + nReportStep1(r.cashAmount); }, 0);
      var wechatTotal = summaryRows.reduce(function(s,r){ return s + nReportStep1(r.wechatAmount); }, 0);
      var alipayTotal = summaryRows.reduce(function(s,r){ return s + nReportStep1(r.alipayAmount); }, 0);
      var bankTotal = summaryRows.reduce(function(s,r){ return s + nReportStep1(r.bankAmount); }, 0);
      var debtMethodTotal = summaryRows.reduce(function(s,r){ return s + nReportStep1(r.debtMethodAmount); }, 0);
      var summary = document.getElementById("reportsStep1Summary");
      var table = document.getElementById("reportsStep1Table");
      var title = document.getElementById("reportsStep1TableTitle");
      title.textContent = "员工销售汇总";
      summary.innerHTML = '<div class="reports-step1-card"><span>员工数</span><b>'+summaryRows.length+'</b></div><div class="reports-step1-card"><span>销售金额</span><b>'+mReportStep1(salesTotal)+'</b></div><div class="reports-step1-card"><span>收款金额</span><b>'+mReportStep1(paidTotal)+'</b></div><div class="reports-step1-card"><span>欠款金额</span><b>'+mReportStep1(debtTotal)+'</b></div><div class="reports-step1-card"><span>现金收入</span><b>'+mReportStep1(cashTotal)+'</b></div><div class="reports-step1-card"><span>微信收入</span><b>'+mReportStep1(wechatTotal)+'</b></div><div class="reports-step1-card"><span>支付宝收入</span><b>'+mReportStep1(alipayTotal)+'</b></div><div class="reports-step1-card"><span>银行卡收入</span><b>'+mReportStep1(bankTotal)+'</b></div><div class="reports-step1-card"><span>赊欠金额</span><b>'+mReportStep1(debtMethodTotal)+'</b></div>';
      table.innerHTML = summaryRows.length ? '<div class="reports-step1-table-wrap"><table class="reports-step1-table"><thead><tr><th>员工姓名</th><th>手机号</th><th>订单数量</th><th>销售金额</th><th>收款金额</th><th>现金</th><th>微信</th><th>支付宝</th><th>银行卡</th><th>赊欠</th><th>欠款金额</th></tr></thead><tbody>' + summaryRows.map(function(r){
        return '<tr><td>'+eReportStep1(r.employee_name)+'</td><td>'+eReportStep1(r.phone || "-")+'</td><td>'+nReportStep1(r.orderCount)+'</td><td>'+mReportStep1(r.salesAmount)+'</td><td>'+mReportStep1(r.paidAmount)+'</td><td>'+mReportStep1(r.cashAmount)+'</td><td>'+mReportStep1(r.wechatAmount)+'</td><td>'+mReportStep1(r.alipayAmount)+'</td><td>'+mReportStep1(r.bankAmount)+'</td><td>'+mReportStep1(r.debtMethodAmount)+'</td><td>'+mReportStep1(r.debtAmount)+'</td></tr>';
      }).join("") + '</tbody></table></div>' : '<div class="reports-step1-empty">当前日期内暂无员工销售记录。</div>';
      return;
    }
    var rows = batchesReportStep1().filter(function(b){ return b && b.confirmed; }).map(function(b){
      var sales = salesAmountReportStep1(b, start, end);
      var reportDate = reportDateForBatchStep1(b, sales);
      var inRange = inDateRangeReportStep1(reportDate, start, end) || sales.amount > 0;
      var purchase = purchaseCostReportStep1(b);
      var baseFee = batchFeeBaseReportStep1(b);
      var principal = purchase + baseFee;
      var feeEffect = consignmentFeeEffectReportStep1(b);
      return {batch:b, sales:sales, reportDate:reportDate, inRange:inRange, purchase:purchase, baseFee:baseFee, principal:principal, feeEffect:feeEffect, settlement:sales.amount + feeEffect, profit:sales.amount - principal};
    }).filter(function(r){
      if(!r.inRange) return false;
      var canViewAllReport = typeof window.cangjieCanViewAllOrdersV94 === "function" ? window.cangjieCanViewAllOrdersV94() : true;
      if(!canViewAllReport && r.sales.amount <= 0) return false;
      if(reportsTabStep1 === "self") return isSelfBatchReportStep1(r.batch) && isSoldDoneReportStep1(r.batch);
      return !isSelfBatchReportStep1(r.batch) && isSoldDoneReportStep1(r.batch);
    });
    var summary = document.getElementById("reportsStep1Summary");
    var table = document.getElementById("reportsStep1Table");
    var title = document.getElementById("reportsStep1TableTitle");
    if(reportsTabStep1 === "self"){
      var saleTotal = rows.reduce(function(s,r){ return s + r.sales.amount; }, 0);
      var principalTotal = rows.reduce(function(s,r){ return s + r.principal; }, 0);
      var profitTotal = rows.reduce(function(s,r){ return s + r.profit; }, 0);
      title.textContent = "自营批次利润汇总";
      summary.innerHTML = '<div class="reports-step1-card"><span>自营批次</span><b>'+rows.length+'</b></div><div class="reports-step1-card"><span>售完金额</span><b>'+mReportStep1(saleTotal)+'</b></div><div class="reports-step1-card"><span>本金</span><b>'+mReportStep1(principalTotal)+'</b></div><div class="reports-step1-card"><span>利润</span><b class="'+(profitTotal>=0?'reports-step1-profit':'reports-step1-loss')+'">'+mReportStep1(profitTotal)+'</b></div>';
      table.innerHTML = rows.length ? '<div class="reports-step1-table-wrap"><table class="reports-step1-table"><thead><tr><th>结算/售完日期</th><th>货主</th><th>批次</th><th>商品数</th><th>售完金额</th><th>进货价成本</th><th>费用</th><th>本金</th><th>利润</th><th>状态</th></tr></thead><tbody>' + rows.map(function(r){
        var cls = r.profit >= 0 ? "reports-step1-profit" : "reports-step1-loss";
        return '<tr><td>'+eReportStep1(dateKeyReportStep1(r.reportDate) || "-")+'</td><td>'+eReportStep1(r.batch.owner || "")+'</td><td>'+eReportStep1(batchNoReportStep1(r.batch))+'</td><td>'+itemsReportStep1(r.batch).length+'</td><td>'+mReportStep1(r.sales.amount)+'</td><td>'+mReportStep1(r.purchase)+'</td><td>'+mReportStep1(r.baseFee)+'</td><td>'+mReportStep1(r.principal)+'</td><td class="'+cls+'">'+mReportStep1(r.profit)+'</td><td><span class="reports-step1-tag">已售完/结算</span></td></tr>';
      }).join("") + '</tbody></table></div>' : '<div class="reports-step1-empty">当前日期内暂无已售完或已结算的自营批次。</div>';
    }else{
      var consignSale = rows.reduce(function(s,r){ return s + r.sales.amount; }, 0);
      var feeAdjust = rows.reduce(function(s,r){ return s + r.feeEffect; }, 0);
      var settlement = rows.reduce(function(s,r){ return s + r.settlement; }, 0);
      title.textContent = "代卖货主结算汇总";
      summary.innerHTML = '<div class="reports-step1-card"><span>代卖批次</span><b>'+rows.length+'</b></div><div class="reports-step1-card"><span>售完金额</span><b>'+mReportStep1(consignSale)+'</b></div><div class="reports-step1-card"><span>费用调整</span><b>'+mReportStep1(feeAdjust)+'</b></div><div class="reports-step1-card"><span>应结货主</span><b>'+mReportStep1(settlement)+'</b></div>';
      table.innerHTML = rows.length ? '<div class="reports-step1-table-wrap"><table class="reports-step1-table"><thead><tr><th>结算/售完日期</th><th>货主</th><th>批次</th><th>商品数</th><th>售完金额</th><th>费用调整</th><th>应结金额</th><th>状态</th></tr></thead><tbody>' + rows.map(function(r){
        return '<tr><td>'+eReportStep1(dateKeyReportStep1(r.reportDate) || "-")+'</td><td>'+eReportStep1(r.batch.owner || "")+'</td><td>'+eReportStep1(batchNoReportStep1(r.batch))+'</td><td>'+itemsReportStep1(r.batch).length+'</td><td>'+mReportStep1(r.sales.amount)+'</td><td>'+mReportStep1(r.feeEffect)+'</td><td>'+mReportStep1(r.settlement)+'</td><td><span class="reports-step1-tag orange">代卖结算</span></td></tr>';
      }).join("") + '</tbody></table></div>' : '<div class="reports-step1-empty">当前日期内暂无已售完或已结算的代卖批次。</div>';
    }
  };
  window.openReportsStep1 = function(){
    ensureReportsStep1Dom();
    ["cashierRoot","inboundRoot","stockRoot","ordersRoot","inventoryStep1Root","ownerStep1Root","configStep1Root","inventoryView"].forEach(function(id){
      var el = document.getElementById(id);
      if(el) el.style.setProperty("display","none","important");
    });
    var root = document.getElementById("reportsStep1Root");
    if(root) root.style.setProperty("display","block","important");
    document.body.classList.remove("show-cashier","show-inbound","show-stock","show-orders","inventory-mode","batch-create-mode","batch-overview-mode");
    document.body.classList.add("reports-mode-step1");
    try{ if(typeof stableTudou2NavStep1 === "function") stableTudou2NavStep1("reports"); }catch(err){}
    renderReportsStep1();
  };
  if(!document.__reportsStep1NavBound){
    document.__reportsStep1NavBound = true;
    document.addEventListener("pointerdown", function(ev){
      var btn = ev.target && ev.target.closest ? ev.target.closest('#globalUnifiedNavV41 [data-page="reports"]') : null;
      if(!btn) return;
      ev.preventDefault();
      ev.stopPropagation();
      if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      window.openReportsStep1();
      return false;
    }, true);
  }
})();

/* extracted script block 35 */
/* ===== Step1 fix: create owner inside batch modal without system prompt ===== */
(function(){
  function eOwnerAddStep1(v){
    return typeof esc === "function" ? esc(v) : String(v ?? "").replace(/[&<>"']/g, function(m){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]; });
  }
  function ensureBatchOwnerAddStyleStep1(){
    if(document.getElementById("batchOwnerAddStep1Style")) return;
    var style = document.createElement("style");
    style.id = "batchOwnerAddStep1Style";
    style.textContent = `
      .batch-owner-add-panel-step1{margin:10px 0 12px;padding:12px;border:1px solid #d9ddd3;border-radius:12px;background:#fbfcf8}
      .batch-owner-add-panel-step1 h4{margin:0 0 9px;font-size:15px;font-weight:950;color:#263028}
      .batch-owner-add-grid-step1{display:grid;grid-template-columns:minmax(0,1fr) 110px 88px;gap:8px;align-items:center}
      .batch-owner-add-grid-step1 input,.batch-owner-add-grid-step1 select{height:38px;border:1px solid #cfd6cb;border-radius:9px;background:#fff;padding:0 10px;font-weight:850;min-width:0}
      .batch-owner-add-grid-step1 button{height:38px;border:0;border-radius:9px;background:#2f8e40;color:#fff;font-weight:950;cursor:pointer}
      @media(max-width:760px){.batch-owner-add-grid-step1{grid-template-columns:1fr}.batch-owner-add-grid-step1 button{width:100%}}
    `;
    document.head.appendChild(style);
  }
  function panelHostStep1(){
    return document.getElementById("batchOwnerListV45") || document.getElementById("batchOwnerSearchInput")?.parentElement;
  }
  window.showBatchOwnerAddInlineStep1 = function(){
    ensureBatchOwnerAddStyleStep1();
    var old = document.getElementById("batchOwnerAddPanelStep1");
    if(old){
      var inputOld = document.getElementById("batchOwnerAddNameStep1");
      if(inputOld) inputOld.focus();
      return;
    }
    var host = panelHostStep1();
    if(!host) return;
    var suggested = (document.getElementById("batchOwnerSearchInput")?.value || "").trim();
    var panel = document.createElement("div");
    panel.id = "batchOwnerAddPanelStep1";
    panel.className = "batch-owner-add-panel-step1";
    panel.innerHTML = '<h4>新增货主</h4><div class="batch-owner-add-grid-step1"><input id="batchOwnerAddNameStep1" placeholder="请输入货主名称" value="'+eOwnerAddStep1(suggested)+'"><select id="batchOwnerAddTypeStep1"><option value="自营">自营</option><option value="代卖">代卖</option></select><button type="button" onclick="saveBatchOwnerAddInlineStep1()">保存</button></div>';
    host.parentElement.insertBefore(panel, host);
    setTimeout(function(){
      var input = document.getElementById("batchOwnerAddNameStep1");
      if(input) input.focus();
    }, 0);
  };
  window.saveBatchOwnerAddInlineStep1 = function(){
    var input = document.getElementById("batchOwnerAddNameStep1");
    var typeEl = document.getElementById("batchOwnerAddTypeStep1");
    var clean = (input && input.value || "").trim();
    if(!clean){
      if(typeof toast === "function") toast("请输入货主名称");
      if(input) input.focus();
      return;
    }
    try{
      if(typeof owners === "undefined" || !Array.isArray(owners)) window.owners = [];
      if(!owners.includes(clean)) owners.push(clean);
      if(typeof newBatchState === "object"){
        newBatchState.owner = clean;
        newBatchState.type = (typeEl && typeEl.value) === "代卖" ? "代卖" : "自营";
      }
      var search = document.getElementById("batchOwnerSearchInput");
      if(search) search.value = "";
      var panel = document.getElementById("batchOwnerAddPanelStep1");
      if(panel) panel.remove();
      if(typeof renderOwnerOptions === "function") renderOwnerOptions();
      if(typeof renderOwnerListForBatchModal === "function") renderOwnerListForBatchModal();
      if(typeof selectOwnerInBatchModal === "function") selectOwnerInBatchModal(clean);
      if(typeof refreshBatchPreview === "function") refreshBatchPreview();
      if(typeof tudou2SaveNow === "function") setTimeout(tudou2SaveNow, 0);
      if(typeof toast === "function") toast("货主已新增");
    }catch(err){
      console.error(err);
      if(typeof toast === "function") toast("新增货主失败，请重试");
    }
  };
  var oldAddOwnerFromBatchModalStep1 = typeof window.addOwnerFromBatchModal === "function" ? window.addOwnerFromBatchModal : null;
  window.addOwnerFromBatchModal = function(){
    showBatchOwnerAddInlineStep1();
  };
  if(!document.__batchOwnerAddStep1ClickBound){
    document.__batchOwnerAddStep1ClickBound = true;
    document.addEventListener("click", function(ev){
      var node = ev.target && ev.target.nodeType === 1 ? ev.target : ev.target && ev.target.parentElement;
      var btn = node && node.closest ? node.closest(".batch-owner-add-btn-v45") : null;
      if(!btn) return;
      ev.preventDefault();
      ev.stopPropagation();
      if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      showBatchOwnerAddInlineStep1();
      return false;
    }, true);
  }
})();

/* extracted script block 36 */
/* ===== Step1 orders: edit completed order ===== */
(function(){
  var editingOrderKeyStep1 = "";

  function numOrderEditStep1(v){ return Number(v || 0) || 0; }
  function escOrderEditStep1(v){ return typeof esc === "function" ? esc(v) : String(v ?? "").replace(/[&<>"']/g, function(m){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]; }); }
  function moneyOrderEditStep1(v){ return typeof money === "function" ? money(v) : numOrderEditStep1(v).toFixed(2); }
  function orderKeyStep1(order){ return String((order && (order.orderNo || order.billNo)) || ""); }
  function orderRowsStep1(){ return (typeof finalOrders !== "undefined" && Array.isArray(finalOrders)) ? finalOrders : []; }
  function buyerRowsStep1(){ return (typeof cashierCustomers !== "undefined" && Array.isArray(cashierCustomers)) ? cashierCustomers : []; }
  function findOrderForEditStep1(key){
    return orderRowsStep1().find(function(o){ return orderKeyStep1(o) === String(key || ""); }) || null;
  }
  function selectedOrderForEditStep1(){
    try{
      var selected = typeof currentSelectedOrderRecord === "function" ? currentSelectedOrderRecord() : null;
      return selected ? findOrderForEditStep1(orderKeyStep1(selected)) : null;
    }catch(err){
      return null;
    }
  }
  function buyerDebtStep1(order){
    return Math.max(numOrderEditStep1(order && order.totalAmount) - numOrderEditStep1(order && order.paid), 0);
  }
  function adjustBuyerDebtStep1(customerId, customerName, delta){
    if(!delta) return;
    var buyer = buyerRowsStep1().find(function(c){ return c && (c.id === customerId || c.name === customerName); });
    if(!buyer) return;
    buyer.debt = Math.max(numOrderEditStep1(buyer.debt) + delta, 0);
  }
  function lineAmountStep1(line){
    var type = line.type || line.pack || "";
    return type === "定装" ? numOrderEditStep1(line.qty) * numOrderEditStep1(line.price) : numOrderEditStep1(line.weight) * numOrderEditStep1(line.price);
  }
  function rebuildOrderTextStep1(order){
    var lines = (order.lines || []).map(function(i, idx){
      return (idx + 1) + ". " + (i.name || "") + "｜" + (i.owner || "") + (i.batchNo || "") + "｜" + (i.type || "") + "｜" + numOrderEditStep1(i.qty) + (i.unit || "件") + "｜" + numOrderEditStep1(i.weight) + "斤｜" + moneyOrderEditStep1(i.price) + "元/" + ((i.type || "") === "定装" ? "件" : "斤") + "｜" + moneyOrderEditStep1(i.amount);
    });
    var text = [
      "仓頡订单",
      "订单号：" + orderKeyStep1(order),
      "客户：" + (order.customerName || ""),
      "时间：" + (order.time || ""),
      "----------------",
      lines.join("\n"),
      "----------------",
      "总数量：" + numOrderEditStep1(order.totalQty),
      "总重量：" + numOrderEditStep1(order.totalWeight) + "斤",
      "原金额：" + moneyOrderEditStep1(order.originalAmount || order.totalAmount),
      "优惠：" + moneyOrderEditStep1(order.discount || 0) + (order.discountNote ? "（" + order.discountNote + "）" : ""),
      "应收金额：" + moneyOrderEditStep1(order.totalAmount),
      "实收：" + moneyOrderEditStep1(order.paid),
      "欠款：" + moneyOrderEditStep1(order.debt)
    ].join("\n");
    if(order.orderRemark || order.remark) text += "\n订单备注：" + (order.orderRemark || order.remark);
    return text;
  }

  function ensureOrderEditStep1Dom(){
    if(!document.getElementById("orderEditStep1Style")){
      var style = document.createElement("style");
      style.id = "orderEditStep1Style";
      style.textContent = `
        .order-edit-step1-mask{position:fixed;inset:0;z-index:100000;display:none;align-items:center;justify-content:center;background:rgba(24,30,26,.44);padding:18px}
        .order-edit-step1-mask.show{display:flex}
        .order-edit-step1-modal{width:min(980px,96vw);max-height:90vh;overflow:auto;background:#fff;border-radius:18px;box-shadow:0 22px 70px rgba(0,0,0,.25);border:1px solid #dfe4dc;color:#1f2a22;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",Arial,sans-serif}
        .order-edit-step1-head{height:66px;border-bottom:1px solid #e5e8df;padding:0 18px;display:flex;align-items:center;justify-content:space-between;gap:12px}
        .order-edit-step1-head h3{margin:0;font-size:20px;font-weight:950}
        .order-edit-step1-actions{display:flex;gap:10px}.order-edit-step1-actions button{height:42px;border:0;border-radius:10px;padding:0 16px;font-weight:950;cursor:pointer}
        .order-edit-step1-gray{background:#e5e8e0;color:#263028}.order-edit-step1-green{background:#2f8e40;color:#fff}.order-edit-step1-red{background:#df3f3f;color:#fff}
        .order-edit-step1-body{padding:16px}
        .order-edit-step1-grid{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:12px}
        .order-edit-step1-field label{display:block;font-size:12px;color:#657066;font-weight:950;margin-bottom:5px}.order-edit-step1-field input,.order-edit-step1-field select{width:100%;height:40px;border:1px solid #d2d8cf;border-radius:10px;padding:0 10px;font-weight:850;background:#fff}
        .order-edit-step1-table-wrap{overflow:auto;border:1px solid #d9ddd3;border-radius:12px}
        .order-edit-step1-table{width:100%;min-width:880px;border-collapse:collapse}.order-edit-step1-table th,.order-edit-step1-table td{border-bottom:1px solid #e5e8df;padding:8px;text-align:left;font-weight:850;font-size:13px}.order-edit-step1-table th{background:#eef1ed;font-weight:950}
        .order-edit-step1-table input{width:100%;height:36px;border:1px solid #d2d8cf;border-radius:8px;padding:0 8px;font-weight:850}
        .order-edit-step1-note{width:100%;height:68px;margin-top:10px;border:1px solid #d2d8cf;border-radius:10px;padding:10px;font-weight:850;resize:vertical}
        .order-edit-step1-summary{margin-top:12px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.order-edit-step1-summary div{border:1px solid #d9ddd3;border-radius:12px;padding:10px;background:#fbfcf8}.order-edit-step1-summary span{display:block;font-size:12px;color:#657066;font-weight:950}.order-edit-step1-summary b{font-size:18px;font-weight:950}
        @media(max-width:980px){.order-edit-step1-grid,.order-edit-step1-summary{grid-template-columns:1fr 1fr}.order-edit-step1-head{display:block;height:auto;padding:12px}.order-edit-step1-actions{margin-top:10px}}
      `;
      document.head.appendChild(style);
    }
    if(document.getElementById("orderEditStep1Mask")) return;
    var mask = document.createElement("div");
    mask.id = "orderEditStep1Mask";
    mask.className = "order-edit-step1-mask";
    mask.innerHTML = '<div class="order-edit-step1-modal"><div class="order-edit-step1-head"><h3 id="orderEditStep1Title">修改订单</h3><div class="order-edit-step1-actions"><button class="order-edit-step1-red" onclick="voidOrderEditStep1()">作废订单</button><button class="order-edit-step1-gray" onclick="closeOrderEditStep1()">取消</button><button class="order-edit-step1-green" onclick="saveOrderEditStep1()">保存修改</button></div></div><div class="order-edit-step1-body" id="orderEditStep1Body"></div></div>';
    mask.addEventListener("click", function(ev){ if(ev.target === mask) closeOrderEditStep1(); });
    document.body.appendChild(mask);
  }
  function ensureOrderEditButtonStep1(){
    var actions = document.querySelector("#ordersRoot .orders-detail-actions");
    if(!actions || document.getElementById("orderEditStep1Btn")) return;
    var btn = document.createElement("button");
    btn.id = "orderEditStep1Btn";
    btn.className = "btn-orange";
    btn.textContent = "修改订单";
    btn.type = "button";
    btn.onclick = openSelectedOrderEditStep1;
    actions.insertBefore(btn, actions.firstChild);
  }
  window.openSelectedOrderEditStep1 = function(){ openOrderEditStep1(selectedOrderForEditStep1()); };
  function openOrderEditStep1(order){
    if(!order){
      if(typeof toast === "function") toast("请先选择一张已完成订单");
      return;
    }
    editingOrderKeyStep1 = orderKeyStep1(order);
    ensureOrderEditStep1Dom();
    var title = document.getElementById("orderEditStep1Title");
    if(title) title.textContent = "修改订单 " + editingOrderKeyStep1;
    var buyerOptions = buyerRowsStep1().map(function(c){
      return '<option value="'+escOrderEditStep1(c.id)+'" '+(c.id === order.customerId ? "selected" : "")+'>'+escOrderEditStep1(c.name)+'</option>';
    }).join("");
    if(!buyerOptions) buyerOptions = '<option value="">'+escOrderEditStep1(order.customerName || "临时客户")+'</option>';
    var body = document.getElementById("orderEditStep1Body");
    body.innerHTML = '<div class="order-edit-step1-grid">'
      + '<div class="order-edit-step1-field"><label>客户</label><select id="orderEditStep1Customer">'+buyerOptions+'</select></div>'
      + '<div class="order-edit-step1-field"><label>优惠金额</label><input id="orderEditStep1Discount" type="number" min="0" step="0.01" value="'+escOrderEditStep1(order.discount || 0)+'"></div>'
      + '<div class="order-edit-step1-field"><label>实收金额</label><input id="orderEditStep1Paid" type="number" min="0" step="0.01" value="'+escOrderEditStep1(order.paid || 0)+'"></div>'
      + '<div class="order-edit-step1-field"><label>优惠备注</label><input id="orderEditStep1DiscountNote" value="'+escOrderEditStep1(order.discountNote || "")+'" placeholder="可不填"></div>'
      + '</div>'
      + '<div class="order-edit-step1-table-wrap"><table class="order-edit-step1-table"><thead><tr><th>货品</th><th>批次</th><th>类型</th><th>数量</th><th>重量</th><th>单价</th><th>金额</th></tr></thead><tbody>'
      + (order.lines || []).map(function(line, idx){
        return '<tr data-order-edit-line="'+idx+'"><td>'+escOrderEditStep1(line.name)+'</td><td>'+escOrderEditStep1((line.owner || "") + (line.batchNo || ""))+'</td><td>'+escOrderEditStep1(line.type || "")+'</td>'
          + '<td><input data-order-edit-field="qty" type="number" min="0" step="0.01" value="'+escOrderEditStep1(line.qty || 0)+'" oninput="previewOrderEditStep1()"></td>'
          + '<td><input data-order-edit-field="weight" type="number" step="0.01" value="'+escOrderEditStep1(line.weight || 0)+'" oninput="previewOrderEditStep1()"></td>'
          + '<td><input data-order-edit-field="price" type="number" min="0" step="0.01" value="'+escOrderEditStep1(line.price || 0)+'" oninput="previewOrderEditStep1()"></td>'
          + '<td><b data-order-edit-amount="'+idx+'">'+moneyOrderEditStep1(line.amount || 0)+'</b></td></tr>';
      }).join("") + '</tbody></table></div>'
      + '<textarea id="orderEditStep1Remark" class="order-edit-step1-note" placeholder="订单备注，可不填">'+escOrderEditStep1(order.orderRemark || order.remark || "")+'</textarea>'
      + '<div class="order-edit-step1-summary" id="orderEditStep1Summary"></div>';
    ["orderEditStep1Discount","orderEditStep1Paid","orderEditStep1DiscountNote","orderEditStep1Remark"].forEach(function(id){
      var el = document.getElementById(id);
      if(el) el.addEventListener("input", previewOrderEditStep1);
    });
    previewOrderEditStep1();
    document.getElementById("orderEditStep1Mask").classList.add("show");
  }
  window.closeOrderEditStep1 = function(){
    var mask = document.getElementById("orderEditStep1Mask");
    if(mask) mask.classList.remove("show");
  };
  function findBatchForOrderLineStep1(line){
    try{
      return (typeof batches !== "undefined" && Array.isArray(batches) ? batches : []).find(function(b){
        var sameOwner = !line.owner || b.owner === line.owner;
        var sameNo = !line.batchNo || String(b.no || b.batchNo || "") === String(line.batchNo || "");
        return sameOwner && sameNo;
      }) || null;
    }catch(err){ return null; }
  }
  function findItemForOrderLineStep1(batch, line){
    if(!batch) return null;
    return (batch.items || []).find(function(item){
      return String(item.goodsId || "") === String(line.goodsId || "") ||
        String(item.id || "") === String(line.itemId || "") ||
        String(item.name || "") === String(line.name || "");
    }) || null;
  }
  function reverseOrderStockStep1(order){
    (order.lines || []).forEach(function(line){
      var batch = findBatchForOrderLineStep1(line);
      var item = findItemForOrderLineStep1(batch, line);
      if(!item) return;
      item.sold = Math.max(numOrderEditStep1(item.sold) - numOrderEditStep1(line.qty), 0);
      item.soldWeight = Math.max(numOrderEditStep1(item.soldWeight) - numOrderEditStep1(line.weight), 0);
    });
  }
  function refreshAfterOrderVoidStep1(){
    try{ if(typeof renderOrdersCenter === "function") renderOrdersCenter(); }catch(err){}
    try{ if(typeof renderInventoryStep1 === "function") renderInventoryStep1(); }catch(err){}
    try{ if(typeof renderStockModule === "function") renderStockModule(); }catch(err){}
    try{ if(typeof renderCashierProducts === "function") renderCashierProducts(); }catch(err){}
    try{ if(typeof renderCashierBatches === "function") renderCashierBatches(); }catch(err){}
    try{ if(typeof renderBuyerV47 === "function") renderBuyerV47(); }catch(err){}
    try{ if(typeof renderOwnerStep1 === "function") renderOwnerStep1(); }catch(err){}
    try{ if(typeof renderReportsStep1 === "function") renderReportsStep1(); }catch(err){}
    try{ if(typeof tudou2SaveNow === "function") setTimeout(tudou2SaveNow, 0); }catch(err){}
  }
  window.voidOrderEditStep1 = function(){
    var order = findOrderForEditStep1(editingOrderKeyStep1);
    if(!order) return;
    if(order.voided || order.status === "已作废"){
      if(typeof toast === "function") toast("该订单已经作废");
      return;
    }
    if(!confirm("确认作废该订单？作废后会冲回客户欠款和库存已售，并从货主结算/报表中排除。")) return;
    var oldDebt = buyerDebtStep1(order);
    reverseOrderStockStep1(order);
    adjustBuyerDebtStep1(order.customerId, order.customerName, -oldDebt);
    order.voided = true;
    order.voidedAt = new Date().toLocaleString("zh-CN", {hour12:false});
    order.voidReason = "订单作废";
    order.statusBeforeVoid = order.status || "";
    order.displayStatusBeforeVoid = order.displayStatus || "";
    order.status = "已作废";
    order.displayStatus = "已作废";
    order.debt = 0;
    order.paid = 0;
    order.text = rebuildOrderTextStep1(order) + "\n订单状态：已作废\n作废时间：" + order.voidedAt;
    closeOrderEditStep1();
    refreshAfterOrderVoidStep1();
    if(typeof toast === "function") toast("订单已作废，库存和欠款已冲回");
  };
  function collectEditedLinesStep1(order){
    return (order.lines || []).map(function(line, idx){
      var row = document.querySelector('[data-order-edit-line="'+idx+'"]');
      var next = Object.assign({}, line);
      if(row){
        next.qty = numOrderEditStep1(row.querySelector('[data-order-edit-field="qty"]')?.value);
        next.weight = numOrderEditStep1(row.querySelector('[data-order-edit-field="weight"]')?.value);
        next.price = numOrderEditStep1(row.querySelector('[data-order-edit-field="price"]')?.value);
        next.amount = lineAmountStep1(next);
      }
      next.index = idx + 1;
      return next;
    });
  }
  window.previewOrderEditStep1 = function(){
    var order = findOrderForEditStep1(editingOrderKeyStep1);
    if(!order) return;
    var lines = collectEditedLinesStep1(order);
    lines.forEach(function(line, idx){
      var cell = document.querySelector('[data-order-edit-amount="'+idx+'"]');
      if(cell) cell.textContent = moneyOrderEditStep1(line.amount);
    });
    var totalQty = lines.reduce(function(sum, line){ return sum + numOrderEditStep1(line.qty); }, 0);
    var totalWeight = lines.reduce(function(sum, line){ return sum + numOrderEditStep1(line.weight); }, 0);
    var originalAmount = lines.reduce(function(sum, line){ return sum + numOrderEditStep1(line.amount); }, 0);
    var discount = Math.min(numOrderEditStep1(document.getElementById("orderEditStep1Discount")?.value), originalAmount);
    var totalAmount = Math.max(originalAmount - discount, 0);
    var paid = Math.min(numOrderEditStep1(document.getElementById("orderEditStep1Paid")?.value), totalAmount);
    var debt = Math.max(totalAmount - paid, 0);
    var summary = document.getElementById("orderEditStep1Summary");
    if(summary){
      summary.innerHTML = '<div><span>总数量</span><b>'+totalQty+'</b></div><div><span>总重量</span><b>'+totalWeight+'斤</b></div><div><span>应收金额</span><b>'+moneyOrderEditStep1(totalAmount)+'</b></div><div><span>欠款</span><b>'+moneyOrderEditStep1(debt)+'</b></div>';
    }
  };
  window.saveOrderEditStep1 = function(){
    var order = findOrderForEditStep1(editingOrderKeyStep1);
    if(!order) return;
    var oldDebt = buyerDebtStep1(order);
    var oldCustomerId = order.customerId;
    var oldCustomerName = order.customerName;
    var customerId = document.getElementById("orderEditStep1Customer")?.value || order.customerId || "";
    var buyer = buyerRowsStep1().find(function(c){ return c && c.id === customerId; });
    order.customerId = buyer ? buyer.id : customerId;
    order.customerName = buyer ? buyer.name : (order.customerName || "");
    order.lines = collectEditedLinesStep1(order);
    order.totalQty = order.lines.reduce(function(sum, line){ return sum + numOrderEditStep1(line.qty); }, 0);
    order.totalWeight = order.lines.reduce(function(sum, line){ return sum + numOrderEditStep1(line.weight); }, 0);
    order.originalAmount = order.lines.reduce(function(sum, line){ return sum + numOrderEditStep1(line.amount); }, 0);
    order.discount = Math.min(numOrderEditStep1(document.getElementById("orderEditStep1Discount")?.value), order.originalAmount);
    order.discountNote = (document.getElementById("orderEditStep1DiscountNote")?.value || "").trim();
    order.totalAmount = Math.max(order.originalAmount - order.discount, 0);
    order.paid = Math.min(numOrderEditStep1(document.getElementById("orderEditStep1Paid")?.value), order.totalAmount);
    order.debt = Math.max(order.totalAmount - order.paid, 0);
    order.status = order.debt > 0 ? "已赊欠" : "已收银";
    order.displayStatus = order.status;
    order.orderRemark = (document.getElementById("orderEditStep1Remark")?.value || "").trim();
    order.remark = order.orderRemark;
    order.editedAt = new Date().toLocaleString("zh-CN", {hour12:false});
    order.text = rebuildOrderTextStep1(order);
    adjustBuyerDebtStep1(oldCustomerId, oldCustomerName, -oldDebt);
    adjustBuyerDebtStep1(order.customerId, order.customerName, buyerDebtStep1(order));
    closeOrderEditStep1();
    try{ if(typeof renderOrdersCenter === "function") renderOrdersCenter(); }catch(err){}
    try{ if(typeof renderInventoryStep1 === "function") renderInventoryStep1(); }catch(err){}
    try{ if(typeof renderCashierProducts === "function") renderCashierProducts(); }catch(err){}
    try{ if(typeof renderBuyerV47 === "function") renderBuyerV47(); }catch(err){}
    try{ if(typeof tudou2SaveNow === "function") setTimeout(tudou2SaveNow, 0); }catch(err){}
    if(typeof toast === "function") toast("订单已修改");
  };
  var oldRenderOrdersCenterEditStep1 = typeof window.renderOrdersCenter === "function" ? window.renderOrdersCenter : null;
  if(oldRenderOrdersCenterEditStep1 && !oldRenderOrdersCenterEditStep1.__orderEditStep1Wrapped){
    window.renderOrdersCenter = function(){
      var result = oldRenderOrdersCenterEditStep1.apply(this, arguments);
      setTimeout(ensureOrderEditButtonStep1, 0);
      return result;
    };
    window.renderOrdersCenter.__orderEditStep1Wrapped = true;
  }
  setTimeout(ensureOrderEditButtonStep1, 0);
})();

/* extracted script block 37 */
/* ===== Step1 final daily-view guard: settled owner batches leave batch and inventory pages ===== */
(function(){
  function allDailyBatchesStep1(){
    try{ return (typeof batches !== "undefined" && Array.isArray(batches)) ? batches : []; }catch(err){ return []; }
  }
  function isOwnerSettlementClosedStep1(b){
    return !!(b && (
      b.ownerSettled ||
      b.ownerSettlementAt ||
      b.saleStatus === "settled"
    ));
  }
  function visibleConfirmedDailyBatchesStep1(){
    try{ if(typeof ensureBatchConfirmFlags === "function") ensureBatchConfirmFlags(); }catch(err){}
    return allDailyBatchesStep1().filter(function(b){
      return !!(b && b.confirmed) && !isOwnerSettlementClosedStep1(b);
    });
  }
  window.isOwnerSettlementClosedStep1 = isOwnerSettlementClosedStep1;
  window.visibleConfirmedDailyBatchesStep1 = visibleConfirmedDailyBatchesStep1;
  window.stockConfirmedBatches = function(){
    return visibleConfirmedDailyBatchesStep1();
  };

  if(typeof window.renderBatches === "function" && !window.renderBatches.__dailySettledGuardStep1){
    window.renderBatches = function(){
      var input = document.getElementById("batchSearch");
      var q = (input ? input.value : "").trim().toLowerCase();
      var list = allDailyBatchesStep1().filter(function(b){
        return b && !isOwnerSettlementClosedStep1(b) && [b.owner,b.no,b.tag].join(" ").toLowerCase().includes(q);
      });
      var box = document.getElementById("batchList");
      if(!box) return;
      box.innerHTML = list.map(function(b){
        return "<div class=\"batch-card "+(b.id===activeBatchId ? "active" : "")+"\" onclick=\"selectBatch('"+esc(b.id)+"')\">"
          + '<div class="owner">'+esc(b.owner)+'</div>'
          + '<div class="no">'+esc(b.no)+'</div>'
          + '<div class="tag">'+esc(b.tag)+'</div>'
          + '</div>';
      }).join("") || '<div class="hint" style="padding:14px 4px">暂无匹配批次</div>';
    };
    window.renderBatches.__dailySettledGuardStep1 = true;
  }

  if(typeof window.renderStockModule === "function" && !window.renderStockModule.__dailySettledGuardStep1){
    var oldRenderStockModuleDailyGuardStep1 = window.renderStockModule;
    window.renderStockModule = function(){
      if(typeof selectedStockBatchId !== "undefined" && selectedStockBatchId !== "all"){
        var selected = allDailyBatchesStep1().find(function(b){ return b && b.id === selectedStockBatchId; });
        if(selected && isOwnerSettlementClosedStep1(selected)) selectedStockBatchId = "all";
      }
      return oldRenderStockModuleDailyGuardStep1.apply(this, arguments);
    };
    window.renderStockModule.__dailySettledGuardStep1 = true;
  }
})();

/* extracted script block 38 */
/* ===== Step1 cashier final guard: reset customer to temporary after completed order ===== */
(function(){
  function tempBuyerStep1(){
    try{
      if(typeof cashierCustomers !== "undefined" && Array.isArray(cashierCustomers)){
        var temp = cashierCustomers.find(function(c){ return c && (c.id === "c1" || c.name === "临时客户"); });
        if(temp) return temp;
        temp = {id:"c1", name:"临时客户", debt:0, payments:[]};
        cashierCustomers.unshift(temp);
        return temp;
      }
    }catch(err){}
    return {id:"c1", name:"临时客户", debt:0, payments:[]};
  }
  function resetCashierToTempStep1(){
    var temp = tempBuyerStep1();
    try{ currentCodeBillItems = []; }catch(err){}
    try{
      window.cashierBillSessionsStep1 = [{
        id:"temp_reset_" + Date.now(),
        customerId:temp.id || "c1",
        name:"临时客户",
        items:[],
        orderRemark:""
      }];
    }catch(err){}
    try{
      var sel = document.getElementById("cashierCustomer");
      if(sel){
        if(typeof renderCashierCustomers === "function") renderCashierCustomers();
        sel.value = temp.id || "c1";
      }
    }catch(err){}
    try{
      var pay = document.getElementById("cashierPayMode");
      if(pay) pay.value = "cash";
    }catch(err){}
    try{
      var paid = document.getElementById("cashierPaidAmount");
      if(paid) paid.value = "";
      var remark = document.getElementById("cashierOrderRemarkStep1");
      if(remark) remark.value = "";
    }catch(err){}
    try{ if(typeof clearCashierDiscountFields === "function") clearCashierDiscountFields(); }catch(err){}
    try{ if(typeof enforceTemporaryCustomerRule === "function") enforceTemporaryCustomerRule(); }catch(err){}
    try{ if(typeof renderCurrentCodeBill === "function") renderCurrentCodeBill(); }catch(err){}
    try{ if(typeof renderCashierCustomerTabsStep1 === "function") renderCashierCustomerTabsStep1(); }catch(err){}
    try{ if(typeof renderCashierProducts === "function") renderCashierProducts(); }catch(err){}
    try{ if(typeof tudou2SaveNow === "function") setTimeout(tudou2SaveNow, 0); }catch(err){}
  }
  window.resetCashierToTempAfterOrderStep1 = resetCashierToTempStep1;

  ["confirmOrderFromCodeBill","completeSettleOrder","checkoutCurrentOrder"].forEach(function(name){
    var oldFn = window[name];
    if(typeof oldFn !== "function" || oldFn.__resetTempAfterOrderStep1) return;
    window[name] = function(){
      var beforeItems = 0;
      var beforePending = "";
      try{ beforeItems = Array.isArray(currentCodeBillItems) ? currentCodeBillItems.length : 0; }catch(err){}
      try{ beforePending = typeof pendingSettleBillNo !== "undefined" ? String(pendingSettleBillNo || "") : ""; }catch(err){}
      var result = oldFn.apply(this, arguments);
      setTimeout(function(){
        var afterItems = 0;
        var afterPending = "";
        try{ afterItems = Array.isArray(currentCodeBillItems) ? currentCodeBillItems.length : 0; }catch(err){}
        try{ afterPending = typeof pendingSettleBillNo !== "undefined" ? String(pendingSettleBillNo || "") : ""; }catch(err){}
        if((beforeItems > 0 && afterItems === 0) || (beforePending && !afterPending)){
          resetCashierToTempStep1();
        }
      }, 0);
      return result;
    };
    window[name].__resetTempAfterOrderStep1 = true;
  });
})();

/* extracted script block 39 */
/* ===== Step1 usability: keep confirm inbound reachable above the bottom chat overlay ===== */
(function(){
  function ensureTopConfirmInboundStep1Style(){
    if(document.getElementById("topConfirmInboundStep1Style")) return;
    var style = document.createElement("style");
    style.id = "topConfirmInboundStep1Style";
    style.textContent = `
      .top-confirm-inbound-step1{
        height:40px;
        border:0;
        border-radius:10px;
        padding:0 16px;
        background:#2f8e40;
        color:#fff;
        font-size:14px;
        font-weight:950;
        cursor:pointer;
        box-shadow:0 6px 14px rgba(47,142,64,.18);
      }
      .top-confirm-inbound-step1:hover{background:#237333}
    `;
    document.head.appendChild(style);
  }
  function currentBatchForTopConfirmStep1(){
    try{
      if(typeof activeBatch === "function"){
        var b = activeBatch();
        if(b) return b;
      }
    }catch(err){}
    try{
      if(typeof activeBatchId !== "undefined" && Array.isArray(batches)){
        return batches.find(function(x){ return x && x.id === activeBatchId; }) || null;
      }
    }catch(err){}
    return null;
  }
  function ensureTopConfirmInboundStep1(){
    ensureTopConfirmInboundStep1Style();
    var actions = document.querySelector(".detail-actions") || document.querySelector("#inboundRoot .tools") || document.querySelector(".right-panel .tools");
    if(!actions) return;
    var btn = document.getElementById("topConfirmInboundStep1Btn");
    var batch = currentBatchForTopConfirmStep1();
    var shouldShow = !!(batch && !batch.confirmed);
    if(!shouldShow){
      if(btn) btn.remove();
      return;
    }
    if(!btn){
      btn = document.createElement("button");
      btn.id = "topConfirmInboundStep1Btn";
      btn.type = "button";
      btn.className = "top-confirm-inbound-step1";
      btn.textContent = "确认入库";
      btn.onclick = function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        if(typeof window.confirmInbound === "function") window.confirmInbound();
        return false;
      };
      actions.appendChild(btn);
    }
  }
  ["renderAll","renderDetail","selectBatch","toggleGoodsToBatch","openBatchCreateFlow"].forEach(function(name){
    var fn = window[name];
    if(typeof fn === "function" && !fn.__topConfirmInboundStep1){
      window[name] = function(){
        var result = fn.apply(this, arguments);
        setTimeout(ensureTopConfirmInboundStep1, 0);
        return result;
      };
      window[name].__topConfirmInboundStep1 = true;
    }
  });
  document.addEventListener("click", function(){
    setTimeout(ensureTopConfirmInboundStep1, 0);
  }, true);
  setTimeout(ensureTopConfirmInboundStep1, 0);
  setTimeout(ensureTopConfirmInboundStep1, 400);
  setTimeout(ensureTopConfirmInboundStep1, 1000);
})();

/* extracted script block 40 */
/* ===== Step1 config: Bluetooth printer connection ===== */
(function(){
  var bluetoothPrinterStep1 = {
    device:null,
    server:null,
    characteristic:null,
    name:"",
    connected:false,
    lastError:""
  };
  var printerServiceCandidatesStep1 = [
    "0000ff00-0000-1000-8000-00805f9b34fb",
    "000018f0-0000-1000-8000-00805f9b34fb",
    "49535343-fe7d-4ae5-8fa9-9fafd205e455",
    "e7810a71-73ae-499d-8c15-faa9aef0c3f2"
  ];
  var printerCharacteristicCandidatesStep1 = [
    "0000ff02-0000-1000-8000-00805f9b34fb",
    "0000ff01-0000-1000-8000-00805f9b34fb",
    "00002af1-0000-1000-8000-00805f9b34fb",
    "49535343-8841-43f4-a8d4-ecbe34729bb3",
    "bef8d6c9-9c21-4c9e-b632-bd58c1009f9f"
  ];

  function eConfigStep1(v){
    return typeof esc === "function" ? esc(v) : String(v ?? "").replace(/[&<>"']/g, function(m){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]; });
  }
  function saveConfigStep1(){
    try{
      localStorage.setItem("tudou2_printer_config_step1", JSON.stringify({
        name:bluetoothPrinterStep1.name || "",
        connected:!!bluetoothPrinterStep1.connected,
        updatedAt:new Date().toLocaleString("zh-CN", {hour12:false})
      }));
    }catch(err){}
  }
  function loadSavedPrinterStep1(){
    try{
      var raw = localStorage.getItem("tudou2_printer_config_step1");
      if(!raw) return {};
      return JSON.parse(raw) || {};
    }catch(err){ return {}; }
  }
  function setStatusStep1(text, cls){
    var el = document.getElementById("configPrinterStatusStep1");
    if(!el) return;
    el.className = "config-step1-status " + (cls || "");
    el.textContent = text;
  }
  function isBluetoothReadyStep1(){
    return !!(navigator && navigator.bluetooth && typeof navigator.bluetooth.requestDevice === "function");
  }
  function isPrinterReadyStep1(){
    return !!(
      bluetoothPrinterStep1.device &&
      bluetoothPrinterStep1.device.gatt &&
      bluetoothPrinterStep1.device.gatt.connected &&
      bluetoothPrinterStep1.characteristic
    );
  }
  function ensureConfigStep1Dom(){
    if(document.getElementById("configStep1Root")) return;
    var style = document.createElement("style");
    style.id = "configStep1Style";
    style.textContent = `
      #configStep1Root{display:none;margin-left:74px;width:calc(100vw - 74px);min-height:100vh;background:#f4f5f1;color:#1f2a22;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",Arial,sans-serif}
      .config-step1-layout{min-height:100vh;background:#fff}
      .config-step1-top{min-height:86px;border-bottom:1px solid #d9ddd3;padding:16px 22px;display:flex;align-items:center;justify-content:space-between;gap:14px;background:#f7f8f4}
      .config-step1-top h1{margin:0;font-size:26px;font-weight:950}
      .config-step1-top p{margin:6px 0 0;color:#667068;font-size:13px;font-weight:850}
      .config-step1-body{padding:18px 22px;display:grid;grid-template-columns:320px minmax(0,1fr);gap:16px}
      .config-step1-side,.config-step1-main{border:1px solid #d9ddd3;border-radius:14px;background:#fff;overflow:hidden}
      .config-step1-side h2,.config-step1-main h2{margin:0;padding:14px 16px;border-bottom:1px solid #e5e8df;font-size:20px;font-weight:950;background:#fbfcf8}
      .config-step1-menu{padding:12px}
      .config-step1-menu button{width:100%;height:54px;border:2px solid #d9ddd3;border-radius:12px;background:#fff;text-align:left;padding:0 14px;margin-bottom:10px;font-size:16px;font-weight:950;cursor:pointer}
      .config-step1-menu button.active{border-color:#2f8e40;background:#eef8ea;color:#168442}
      .config-step1-card{padding:16px;border-bottom:1px solid #e5e8df}
      .config-step1-card:last-child{border-bottom:0}
      .config-step1-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}
      .config-step1-row b{font-size:18px}
      .config-step1-row span,.config-step1-note{color:#667068;font-size:13px;font-weight:850;line-height:1.7}
      .config-step1-status{display:inline-flex;align-items:center;min-height:30px;border-radius:999px;padding:0 12px;background:#ecefeb;color:#687066;font-weight:950}
      .config-step1-status.ok{background:#e9f8ee;color:#23733b}.config-step1-status.warn{background:#fff4e6;color:#b45b00}.config-step1-status.bad{background:#ffecec;color:#a52a2a}
      .config-step1-actions{display:flex;gap:10px;flex-wrap:wrap}
      .config-step1-actions button{height:42px;border:0;border-radius:10px;padding:0 16px;font-weight:950;cursor:pointer}
      .config-step1-green{background:#2f8e40;color:#fff}.config-step1-gray{background:#e5e8e0;color:#263028}.config-step1-red{background:#df3f3f;color:#fff}
      .config-step1-printer-name{font-size:22px;font-weight:950;color:#1f2a22;margin:8px 0}
      .config-step1-test{width:100%;height:96px;border:1px solid #d2d8cf;border-radius:12px;padding:10px;font-weight:850;resize:vertical}
      @media(max-width:980px){#configStep1Root{margin-left:0;margin-top:58px;width:100vw}.config-step1-body{grid-template-columns:1fr}.config-step1-top{display:block}}
    `;
    document.head.appendChild(style);
    var root = document.createElement("div");
    root.id = "configStep1Root";
    root.innerHTML = '<div class="config-step1-layout"><header class="config-step1-top"><div><h1>连接配置</h1><p>连接蓝牙打印机，后续订单和码单可打印纸张单给客户。</p></div><span id="configPrinterStatusStep1" class="config-step1-status">未连接</span></header><div class="config-step1-body"><aside class="config-step1-side"><h2>配置项</h2><div class="config-step1-menu"><button class="active" type="button">打印配置</button><button type="button" onclick="toast && toast(\'单位管理下一步接入\')">单位管理</button><button type="button" onclick="toast && toast(\'销售配置下一步接入\')">销售配置</button></div></aside><main class="config-step1-main"><h2>蓝牙打印机</h2><section class="config-step1-card"><div class="config-step1-row"><div><b>当前打印机</b><div id="configPrinterNameStep1" class="config-step1-printer-name">未连接</div><span id="configPrinterSubStep1">点击连接后，在系统弹窗中选择你的蓝牙打印机。</span></div><span id="configBluetoothSupportStep1" class="config-step1-status">检测中</span></div><div class="config-step1-actions"><button class="config-step1-green" type="button" onclick="connectBluetoothPrinterStep1()">连接蓝牙打印机</button><button class="config-step1-gray" type="button" onclick="disconnectBluetoothPrinterStep1()">断开</button><button class="config-step1-gray" type="button" onclick="renderConfigStep1()">刷新状态</button></div></section><section class="config-step1-card"><div class="config-step1-row"><div><b>测试打印</b><br><span>连接成功后可以先打印一张测试纸，确认纸张和编码正常。</span></div></div><textarea id="configTestPrintTextStep1" class="config-step1-test">仓頡\n蓝牙打印测试\n连接成功后可打印客户纸张单\n</textarea><div class="config-step1-actions" style="margin-top:10px"><button class="config-step1-green" type="button" onclick="testPrintBluetoothStep1()">测试打印</button><button class="config-step1-gray" type="button" onclick="window.print()">浏览器打印备用</button></div><p class="config-step1-note">提示：POS891/892 这类打印机很多是经典蓝牙。macOS 弹出配对密码窗口时，通常要输入打印机默认 PIN（常见为 0000 或 1234）；如果配对后仍无法测试打印，说明当前设备不是浏览器可直连的 BLE 打印机，需要使用浏览器打印备用或专用打印插件。</p></section></main></div></div>';
    document.body.appendChild(root);
  }
  async function findPrinterCharacteristicStep1(server){
    var services = [];
    try{
      services = await server.getPrimaryServices();
    }catch(err){}
    for(var si = 0; si < printerServiceCandidatesStep1.length; si++){
      try{
        var service = await server.getPrimaryService(printerServiceCandidatesStep1[si]);
        services.unshift(service);
      }catch(err){}
    }
    var seen = [];
    for(var i = 0; i < services.length; i++){
      var service = services[i];
      if(!service || seen.indexOf(service.uuid) >= 0) continue;
      seen.push(service.uuid);
      for(var ci = 0; ci < printerCharacteristicCandidatesStep1.length; ci++){
        try{
          var ch = await service.getCharacteristic(printerCharacteristicCandidatesStep1[ci]);
          if(ch) return ch;
        }catch(err){}
      }
      try{
        var chars = await service.getCharacteristics();
        var writable = chars.find(function(ch){ return ch && ch.properties && (ch.properties.write || ch.properties.writeWithoutResponse); });
        if(writable) return writable;
      }catch(err){}
    }
    throw new Error("未找到可写入的打印机通道");
  }
  async function writePrinterBytesStep1(bytes){
    if(!isPrinterReadyStep1()) throw new Error("打印机未真正连通，请重新连接或使用浏览器打印备用");
    var chunkSize = 180;
    for(var i = 0; i < bytes.length; i += chunkSize){
      var chunk = bytes.slice(i, i + chunkSize);
      if(bluetoothPrinterStep1.characteristic.writeValueWithoutResponse){
        await bluetoothPrinterStep1.characteristic.writeValueWithoutResponse(chunk);
      }else{
        await bluetoothPrinterStep1.characteristic.writeValue(chunk);
      }
    }
  }
  function textToPrinterBytesStep1(text){
    var encoder = new TextEncoder();
    var body = encoder.encode(String(text || "") + "\n\n\n");
    var init = new Uint8Array([0x1b,0x40]);
    var cut = new Uint8Array([0x1d,0x56,0x42,0x00]);
    var bytes = new Uint8Array(init.length + body.length + cut.length);
    bytes.set(init, 0);
    bytes.set(body, init.length);
    bytes.set(cut, init.length + body.length);
    return bytes;
  }
  window.renderConfigStep1 = function(){
    ensureConfigStep1Dom();
    var saved = loadSavedPrinterStep1();
    var support = document.getElementById("configBluetoothSupportStep1");
    if(support){
      support.textContent = isBluetoothReadyStep1() ? "支持蓝牙" : "当前浏览器不支持";
      support.className = "config-step1-status " + (isBluetoothReadyStep1() ? "ok" : "bad");
    }
    bluetoothPrinterStep1.connected = isPrinterReadyStep1();
    var name = bluetoothPrinterStep1.connected ? bluetoothPrinterStep1.name : (saved.name ? saved.name + "（上次连接）" : "未连接");
    var nameEl = document.getElementById("configPrinterNameStep1");
    if(nameEl) nameEl.textContent = name;
    var sub = document.getElementById("configPrinterSubStep1");
    if(sub){
      sub.textContent = bluetoothPrinterStep1.connected ? "已连接到可写通道，可以进行测试打印。" : (isBluetoothReadyStep1() ? "点击连接后，如果系统要求密码，请先完成配对；浏览器必须找到可写通道才算可用。" : "当前环境无法直接调用 Web Bluetooth，可先使用浏览器打印备用。");
    }
    if(bluetoothPrinterStep1.connected) setStatusStep1("已可打印", "ok");
    else if(bluetoothPrinterStep1.lastError) setStatusStep1(bluetoothPrinterStep1.lastError, "bad");
    else setStatusStep1(saved.name ? "未连接（有历史设备）" : "未连接", "warn");
  };
  window.ensureConfigStep1Dom = ensureConfigStep1Dom;
  window.connectBluetoothPrinterStep1 = async function(){
    ensureConfigStep1Dom();
    bluetoothPrinterStep1.lastError = "";
    if(!isBluetoothReadyStep1()){
      bluetoothPrinterStep1.lastError = "浏览器不支持蓝牙";
      renderConfigStep1();
      if(typeof toast === "function") toast("当前浏览器不支持 Web Bluetooth");
      return;
    }
    try{
      setStatusStep1("正在选择设备...", "warn");
      var device = await navigator.bluetooth.requestDevice({
        acceptAllDevices:true,
        optionalServices:printerServiceCandidatesStep1
      });
      bluetoothPrinterStep1.device = device;
      bluetoothPrinterStep1.name = device.name || "蓝牙打印机";
      device.addEventListener("gattserverdisconnected", function(){
        bluetoothPrinterStep1.connected = false;
        bluetoothPrinterStep1.server = null;
        bluetoothPrinterStep1.characteristic = null;
        bluetoothPrinterStep1.lastError = "连接已断开";
        renderConfigStep1();
      });
      setStatusStep1("正在连接...", "warn");
      var server = await device.gatt.connect();
      var characteristic = await findPrinterCharacteristicStep1(server);
      bluetoothPrinterStep1.server = server;
      bluetoothPrinterStep1.characteristic = characteristic;
      bluetoothPrinterStep1.connected = isPrinterReadyStep1();
      bluetoothPrinterStep1.lastError = "";
      saveConfigStep1();
      renderConfigStep1();
      if(typeof toast === "function") toast(bluetoothPrinterStep1.connected ? "蓝牙打印机已连接" : "蓝牙未真正连通");
    }catch(err){
      bluetoothPrinterStep1.connected = false;
      bluetoothPrinterStep1.characteristic = null;
      bluetoothPrinterStep1.lastError = err && err.message ? err.message : "连接失败";
      renderConfigStep1();
      if(typeof toast === "function") toast("蓝牙连接失败");
    }
  };
  window.disconnectBluetoothPrinterStep1 = function(){
    try{
      if(bluetoothPrinterStep1.device && bluetoothPrinterStep1.device.gatt && bluetoothPrinterStep1.device.gatt.connected){
        bluetoothPrinterStep1.device.gatt.disconnect();
      }
    }catch(err){}
    bluetoothPrinterStep1.connected = false;
    bluetoothPrinterStep1.server = null;
    bluetoothPrinterStep1.characteristic = null;
    bluetoothPrinterStep1.lastError = "";
    renderConfigStep1();
    if(typeof toast === "function") toast("已断开蓝牙打印机");
  };
  window.testPrintBluetoothStep1 = async function(){
    try{
      var text = document.getElementById("configTestPrintTextStep1")?.value || "仓頡 蓝牙打印测试";
      await writePrinterBytesStep1(textToPrinterBytesStep1(text));
      if(typeof toast === "function") toast("测试打印已发送");
    }catch(err){
      bluetoothPrinterStep1.lastError = err && err.message ? err.message : "打印失败";
      renderConfigStep1();
      if(typeof toast === "function") toast("打印失败，请检查连接");
    }
  };
})();

/* extracted script block 41 */
/* ===== Step1 final guard: make confirm inbound clickable and deterministic ===== */
(function(){
  function currentConfirmBatchStep1(){
    try{
      if(typeof activeBatch === "function"){
        var b = activeBatch();
        if(b) return b;
      }
    }catch(err){}
    try{
      if(typeof activeBatchId !== "undefined" && Array.isArray(batches)){
        var byId = batches.find(function(x){ return x && x.id === activeBatchId; });
        if(byId) return byId;
      }
    }catch(err){}
    try{ return Array.isArray(batches) ? batches[0] : null; }catch(err){}
    return null;
  }

  function syncAfterConfirmInboundStep1(){
    try{ if(typeof renderAll === "function") renderAll(); }catch(err){}
    try{ if(typeof renderCashierBatches === "function") renderCashierBatches(); }catch(err){}
    try{ if(typeof renderCashierProducts === "function") renderCashierProducts(); }catch(err){}
    try{ if(typeof renderInventoryStep1 === "function") renderInventoryStep1(); }catch(err){}
    try{ if(typeof renderStockModule === "function") renderStockModule(); }catch(err){}
    try{ if(typeof tudou2SaveNow === "function") setTimeout(tudou2SaveNow, 0); }catch(err){}
  }

  var previousConfirmInboundStep1 = typeof window.confirmInbound === "function" ? window.confirmInbound : null;
  window.confirmInbound = function(){
    var b = currentConfirmBatchStep1();
    if(!b){
      if(typeof toast === "function") toast("请先创建或选择批次");
      return false;
    }
    b.confirmed = true;
    b.inboundConfirmedAt = new Date().toLocaleString("zh-CN", {hour12:false});
    try{
      if(previousConfirmInboundStep1 && previousConfirmInboundStep1 !== window.confirmInbound){
        previousConfirmInboundStep1.apply(this, arguments);
      }
    }catch(err){}
    b.confirmed = true;
    if(!b.inboundConfirmedAt) b.inboundConfirmedAt = new Date().toLocaleString("zh-CN", {hour12:false});
    syncAfterConfirmInboundStep1();
    if(typeof toast === "function") toast("已确认入库，该批次商品已进入库存和收银");
    setTimeout(function(){
      try{
        if(typeof returnToBatchOverviewStep1 === "function"){
          returnToBatchOverviewStep1();
        }else if(typeof closeBatchCreateFlowToOverview === "function"){
          closeBatchCreateFlowToOverview();
        }else if(typeof showAppPage === "function"){
          showAppPage("stock");
        }
      }catch(err){}
    }, 0);
    return false;
  };
  window.confirmInbound.__step1FinalGuard = true;

  if(!document.__confirmInboundStep1FinalClickBound){
    document.__confirmInboundStep1FinalClickBound = true;
    document.addEventListener("click", function(ev){
      var node = ev.target && ev.target.nodeType === 1 ? ev.target : ev.target && ev.target.parentElement;
      var btn = node && node.closest ? node.closest("button") : null;
      if(!btn) return;
      if((btn.textContent || "").trim() !== "确认入库") return;
      ev.preventDefault();
      ev.stopPropagation();
      if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      window.confirmInbound();
      return false;
    }, true);
  }
})();

/* extracted script block 42 */
/* ===== Step1 final nav guard: keep Config visible and routable ===== */
(function(){
  function configNavHtmlStep1(active){
    function cls(page){ return active === page ? " active" : ""; }
    return '<div class="v41-logo">仓頡</div>'
      + '<button class="v41-nav-btn'+cls("cashier")+'" data-page="cashier">收银</button>'
      + '<button class="v41-nav-btn'+cls("stock")+'" data-page="stock">批次</button>'
      + '<button class="v41-nav-btn'+cls("inventoryStep1")+'" data-page="inventoryStep1">库存</button>'
      + '<button class="v41-nav-btn'+cls("orders")+'" data-page="orders">订单</button>'
      + '<button class="v41-nav-btn'+cls("ownersStep1")+'" data-page="ownersStep1">货主</button>'
      + '<button class="v41-nav-btn'+cls("buyers")+'" data-page="buyers">买家管理</button>'
      + '<button class="v41-nav-btn'+cls("reports")+'" data-page="reports">报表</button>'
      + '<button class="v41-nav-btn'+cls("configStep1")+'" data-config-direct="1">配置</button>'
      + '<button class="v41-nav-btn'+cls("profileV92")+'" data-page="profileV92">个人中心</button>';
  }
  function currentPageForConfigNavStep1(){
    if(document.body.classList.contains("show-profile-v92")) return "profileV92";
    if(document.getElementById("configStep1Root")?.style.display === "block") return "configStep1";
    if(document.getElementById("reportsStep1Root")?.style.display === "block") return "reports";
    if(document.getElementById("ownerStep1Root")?.style.display === "block") return "ownersStep1";
    if(document.body.classList.contains("inventory-mode")) return "inventoryStep1";
    if(document.body.classList.contains("show-orders")) return "orders";
    if(document.body.classList.contains("show-stock") || document.body.classList.contains("show-inbound")) return "stock";
    return "cashier";
  }
  function forceConfigNavStep1(active){
    var nav = document.getElementById("globalUnifiedNavV41");
    if(!nav) return;
    active = active || currentPageForConfigNavStep1();
    var labels = Array.from(nav.querySelectorAll(".v41-nav-btn")).map(function(btn){ return (btn.textContent || "").trim(); });
    var expected = ["收银","批次","库存","订单","货主","买家管理","报表","配置","个人中心"];
    var wrong = labels.length !== expected.length || expected.some(function(label, idx){ return labels[idx] !== label; });
    var activeBtn = nav.querySelector(".v41-nav-btn.active");
    if(wrong || !activeBtn || activeBtn.getAttribute("data-page") !== active){
      nav.innerHTML = configNavHtmlStep1(active);
    }
  }
  function hideConfigRootStep1(){
    var root = document.getElementById("configStep1Root");
    if(root) root.style.setProperty("display", "none", "important");
  }
  function routeGlobalNavStep1(page){
    if(page === "config" || page === "settings" || page === "connection") page = "configStep1";
    if(page === "profile" || page === "personalCenter") page = "profileV92";
    if(page === "inventory") page = "inventoryStep1";
    if(page === "owner" || page === "owners") page = "ownersStep1";
    if(page === "batch" || page === "inbound") page = "stock";
    if(page === "reports" && typeof window.openReportsStep1 === "function"){
      window.openReportsStep1();
      return;
    }
    window.showAppPage(page || "cashier");
  }
  var oldShowAppPageConfigFinalStep1 = typeof window.showAppPage === "function" ? window.showAppPage : null;
  window.showAppPage = function(page){
    if(page === "config" || page === "settings" || page === "connection") page = "configStep1";
    if(page === "configStep1"){
      if(typeof ensureConfigStep1Dom === "function") ensureConfigStep1Dom();
      ["cashierRoot","inboundRoot","stockRoot","ordersRoot","inventoryStep1Root","ownerStep1Root","reportsStep1Root","profileCenterRootV92","inventoryView"].forEach(function(id){
        var el = document.getElementById(id);
        if(el) el.style.setProperty("display", "none", "important");
      });
      var root = document.getElementById("configStep1Root");
      if(root) root.style.setProperty("display", "block", "important");
      document.body.classList.remove("show-cashier","show-inbound","show-stock","show-orders","show-profile-v92","inventory-mode","batch-create-mode","batch-overview-mode","reports-mode-step1");
      forceConfigNavStep1("configStep1");
      try{ if(typeof renderConfigStep1 === "function") renderConfigStep1(); }catch(err){}
      return;
    }
    if(page === "profileV92"){
      if(typeof window.showProfileCenterV92 === "function") window.showProfileCenterV92();
      return;
    }
    hideConfigRootStep1();
    var result = oldShowAppPageConfigFinalStep1 ? oldShowAppPageConfigFinalStep1.apply(this, arguments) : undefined;
    setTimeout(function(){ forceConfigNavStep1(currentPageForConfigNavStep1()); }, 0);
    return result;
  };
  window.stableTudou2NavStep1 = forceConfigNavStep1;
  function installHardNavClickStep1(ev){
    var btn = ev.target && ev.target.closest ? ev.target.closest("#globalUnifiedNavV41 .v41-nav-btn") : null;
    if(!btn) return;
    var page = btn.getAttribute("data-page") || (btn.hasAttribute("data-config-step1") || btn.hasAttribute("data-config-direct") ? "configStep1" : "");
    if(!page) return;
    ev.preventDefault();
    ev.stopPropagation();
    if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    routeGlobalNavStep1(page);
    return false;
  }
  ["pointerdown","touchstart","click"].forEach(function(type){
    document.addEventListener(type, installHardNavClickStep1, true);
  });
  var hardNavStyleStep1 = document.createElement("style");
  hardNavStyleStep1.textContent = "#globalUnifiedNavV41{position:fixed!important;z-index:2147483000!important;pointer-events:auto!important}#globalUnifiedNavV41 .v41-nav-btn{pointer-events:auto!important;touch-action:manipulation!important}";
  document.head.appendChild(hardNavStyleStep1);
  setTimeout(function(){ forceConfigNavStep1(); }, 0);
  setTimeout(function(){ forceConfigNavStep1(); }, 300);
  setTimeout(function(){ forceConfigNavStep1(); }, 1000);
})();

/* extracted script block 43 */
/* ===== Step1 emergency config launcher: plain JS, survives old nav redraws ===== */
(function(){
  function hideByIdStep1(id){
    var el = document.getElementById(id);
    if(el) el.style.setProperty("display","none","important");
  }
  function ensureSimpleConfigRootStep1(){
    if(typeof window.ensureConfigStep1Dom === "function"){
      window.ensureConfigStep1Dom();
      return;
    }
    if(document.getElementById("configStep1Root")) return;
    var style = document.createElement("style");
    style.textContent = "#configStep1Root{display:none;margin-left:74px;width:calc(100vw - 74px);min-height:100vh;background:#fff;color:#1f2a22;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',Arial,sans-serif}.config-fallback-head{padding:18px 22px;border-bottom:1px solid #d9ddd3;background:#f7f8f4}.config-fallback-head h1{margin:0;font-size:26px;font-weight:950}.config-fallback-body{padding:18px 22px}.config-fallback-card{border:1px solid #d9ddd3;border-radius:14px;padding:16px;margin-bottom:14px}.config-fallback-actions{display:flex;gap:10px;flex-wrap:wrap}.config-fallback-actions button{height:42px;border:0;border-radius:10px;padding:0 16px;font-weight:950;cursor:pointer}.config-fallback-green{background:#2f8e40;color:#fff}.config-fallback-gray{background:#e5e8e0;color:#263028}";
    document.head.appendChild(style);
    var root = document.createElement("div");
    root.id = "configStep1Root";
    root.innerHTML = '<div class="config-fallback-head"><h1>连接配置</h1><p>连接蓝牙打印机，后续订单和码单可打印纸张单给客户。</p></div><div class="config-fallback-body"><div class="config-fallback-card"><h2>蓝牙打印机</h2><p id="configPrinterStatusStep1">未连接</p><div class="config-fallback-actions"><button class="config-fallback-green" type="button" onclick="connectBluetoothPrinterStep1()">连接蓝牙打印机</button><button class="config-fallback-gray" type="button" onclick="disconnectBluetoothPrinterStep1()">断开</button><button class="config-fallback-gray" type="button" onclick="window.print()">浏览器打印备用</button></div></div><div class="config-fallback-card"><h2>测试打印</h2><textarea id="configTestPrintTextStep1" style="width:100%;height:96px;border:1px solid #d2d8cf;border-radius:12px;padding:10px">仓頡\\n蓝牙打印测试\\n</textarea><div class="config-fallback-actions" style="margin-top:10px"><button class="config-fallback-green" type="button" onclick="testPrintBluetoothStep1()">测试打印</button></div><p>如果系统弹出蓝牙配对密码，常见默认密码是 0000 或 1234。</p></div></div>';
    document.body.appendChild(root);
  }
  window.openConfigStep1 = function(){
    ensureSimpleConfigRootStep1();
    ["cashierRoot","inboundRoot","stockRoot","ordersRoot","inventoryStep1Root","ownerStep1Root","reportsStep1Root","inventoryView"].forEach(hideByIdStep1);
    var root = document.getElementById("configStep1Root");
    if(root) root.style.setProperty("display","block","important");
    document.body.classList.remove("show-cashier","show-inbound","show-stock","show-orders","inventory-mode","batch-create-mode","batch-overview-mode","reports-mode-step1");
    if(typeof window.renderConfigStep1 === "function") window.renderConfigStep1();
    installConfigButtonStep1("configStep1");
  };
  function installConfigButtonStep1(active){
    var nav = document.getElementById("globalUnifiedNavV41");
    if(!nav) return;
    var configButtons = Array.from(nav.querySelectorAll(".v41-nav-btn")).filter(function(button){
      return button.getAttribute("data-config-direct") === "1" || button.getAttribute("data-config-step1") === "1" || (button.textContent || "").trim() === "配置";
    });
    var btn = configButtons[0] || null;
    for(var i=1;i<configButtons.length;i++){
      if(configButtons[i].parentNode) configButtons[i].parentNode.removeChild(configButtons[i]);
    }
    if(!btn){
      btn = document.createElement("button");
      btn.type = "button";
      nav.appendChild(btn);
    }
    btn.className = "v41-nav-btn" + (active === "configStep1" ? " active" : "");
    btn.setAttribute("data-config-direct","1");
    btn.removeAttribute("data-config-step1");
    btn.textContent = "配置";
    btn.onclick = function(ev){
      if(ev){ ev.preventDefault(); ev.stopPropagation(); }
      window.openConfigStep1();
      return false;
    };
  }
  document.addEventListener("click", function(ev){
    var node = ev.target && ev.target.closest ? ev.target.closest("#globalUnifiedNavV41 [data-config-direct]") : null;
    if(!node) return;
    ev.preventDefault();
    ev.stopPropagation();
    if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    window.openConfigStep1();
    return false;
  }, true);
  function tick(){
    var isConfig = document.getElementById("configStep1Root") && document.getElementById("configStep1Root").style.display === "block";
    installConfigButtonStep1(isConfig ? "configStep1" : "");
  }
  setTimeout(tick, 0);
  setTimeout(tick, 100);
  setTimeout(tick, 300);
  setTimeout(tick, 800);
  setInterval(tick, 1200);
})();

/* extracted script block 44 */
/* ===== Step1 final orders guard: persist and show completed orders reliably ===== */
(function(){
  function numOrderGuardStep1(v){ return Number(v || 0) || 0; }
  function orderKeyGuardStep1(order){
    return String((order && (order.orderNo || order.billNo || order.id)) || "");
  }
  function isVoidOrderGuardStep1(order){
    if(!order) return false;
    return !!order.voided || order.status === "已作废" || order.displayStatus === "已作废";
  }
  function isUnfinishedCodeBillStep1(order){
    var st = String((order && (order.status || order.displayStatus)) || "");
    if(isVoidOrderGuardStep1(order)) return false;
    if(order && order.orderNo) return false;
    return !st || st === "待处理" || st === "已开码单" || st === "未下单" || st === "码单";
  }

  window.normalizeOrderType = function(order){
    if(!order) return "待处理";
    if(isVoidOrderGuardStep1(order)) return "已作废";
    var st = String(order.status || order.displayStatus || "");
    if(st === "已赊欠" || st === "部分还款") return "已赊欠";
    if(st === "已收银" || st === "已结清") return "已收银";
    if(st === "已下单") return numOrderGuardStep1(order.debt) > 0 ? "已赊欠" : "已收银";
    if(numOrderGuardStep1(order.debt) > 0) return "已赊欠";
    if(order.orderNo || numOrderGuardStep1(order.paid) > 0 || numOrderGuardStep1(order.totalAmount) > 0) return "已收银";
    return "待处理";
  };

  window.allOrderRecords = function(){
    var rows = [];
    try{
      (Array.isArray(finalOrders) ? finalOrders : []).forEach(function(o){
        if(!o) return;
        var st = window.normalizeOrderType(o);
        if(st === "待处理") return;
        rows.push(Object.assign({}, o, {
          recordSource:"订单",
          displayStatus:st,
          centerId:"order_" + orderKeyGuardStep1(o)
        }));
      });
    }catch(err){}
    try{
      (Array.isArray(savedCodeBills) ? savedCodeBills : []).forEach(function(b){
        if(!b || isUnfinishedCodeBillStep1(b)) return;
        var st = window.normalizeOrderType(b);
        if(st === "待处理") return;
        rows.push(Object.assign({}, b, {
          recordSource:"订单",
          displayStatus:st,
          centerId:"order_" + orderKeyGuardStep1(b)
        }));
      });
    }catch(err){}
    try{
      (Array.isArray(orders) ? orders : []).forEach(function(o){
        if(!o) return;
        var st = window.normalizeOrderType(o);
        if(st === "待处理") return;
        rows.push(Object.assign({}, o, {
          recordSource:"订单",
          displayStatus:st,
          centerId:"order_" + orderKeyGuardStep1(o)
        }));
      });
    }catch(err){}
    try{
      var covered = {};
      rows.forEach(function(o){
        (o.lines || []).forEach(function(line){
          var k = [line.owner || "", line.batchNo || "", line.name || line.goodsName || line.goodsId || ""].join("||");
          covered[k] = (covered[k] || 0) + numOrderGuardStep1(line.qty);
        });
      });
      (Array.isArray(batches) ? batches : []).forEach(function(b){
        if(!b || !Array.isArray(b.items)) return;
        var batchNo = b.no || b.batchNo || "";
        var orphanLines = [];
        b.items.forEach(function(item){
          var sold = numOrderGuardStep1(item.sold);
          if(sold <= 0) return;
          var k = [b.owner || "", batchNo, item.name || item.goodsName || item.goodsId || ""].join("||");
          var missing = Math.max(sold - (covered[k] || 0), 0);
          if(missing <= 0) return;
          var fixed = (item.pack || item.type || "") === "定装";
          var weight = fixed ? missing * numOrderGuardStep1(item.spec) : numOrderGuardStep1(item.soldWeight);
          orphanLines.push({
            index:orphanLines.length + 1,
            name:item.name || item.goodsName || "未命名货品",
            goodsId:item.goodsId || item.id || "",
            owner:b.owner || "",
            batchNo:batchNo,
            type:item.pack || item.type || "",
            unit:item.unit || "件",
            qty:missing,
            weight:weight,
            price:0,
            amount:0
          });
        });
        if(!orphanLines.length) return;
        var key = "历史销量-" + String(b.id || batchNo || Date.now());
        rows.push({
          orderNo:key,
          billNo:key,
          customerName:"历史销量记录",
          time:b.inboundConfirmedAt || b.updatedAt || b.createdAt || "",
          status:"已收银",
          displayStatus:"已收银",
          recordSource:"历史销量",
          totalQty:orphanLines.reduce(function(s,line){ return s + numOrderGuardStep1(line.qty); }, 0),
          totalWeight:orphanLines.reduce(function(s,line){ return s + numOrderGuardStep1(line.weight); }, 0),
          totalAmount:0,
          paid:0,
          debt:0,
          lines:orphanLines,
          text:"历史销量记录：旧版保存曾只保留库存已售数量，没有保留完整订单。"
        });
      });
    }catch(err){}

    var map = new Map();
    rows.forEach(function(r){
      var key = orderKeyGuardStep1(r);
      if(!key) key = "time_" + String(r.time || "") + "_" + String(r.customerName || "");
      if(!map.has(key) || r.recordSource === "订单") map.set(key, r);
    });
    return Array.from(map.values()).sort(function(a,b){
      return String(b.time || "").localeCompare(String(a.time || ""));
    });
  };

  function ensureVoidStatusOptionStep1(){
    var select = document.getElementById("ordersStatusFilter");
    if(!select || Array.from(select.options).some(function(o){ return o.value === "已作废"; })) return;
    var opt = document.createElement("option");
    opt.value = "已作废";
    opt.textContent = "已作废";
    select.appendChild(opt);
  }

  var previousRenderOrdersCenterGuardStep1 = typeof window.renderOrdersCenter === "function" ? window.renderOrdersCenter : null;
  if(previousRenderOrdersCenterGuardStep1 && !previousRenderOrdersCenterGuardStep1.__ordersGuardStep1){
    window.renderOrdersCenter = function(){
      ensureVoidStatusOptionStep1();
      var result = previousRenderOrdersCenterGuardStep1.apply(this, arguments);
      try{
        var empty = document.querySelector("#ordersList .orders-empty");
        if(empty && window.allOrderRecords().length){
          var statusEl = document.getElementById("ordersStatusFilter");
          if(statusEl) statusEl.value = "";
          result = previousRenderOrdersCenterGuardStep1.apply(this, arguments);
        }
      }catch(err){}
      return result;
    };
    window.renderOrdersCenter.__ordersGuardStep1 = true;
  }

  setTimeout(function(){
    ensureVoidStatusOptionStep1();
    try{ if(typeof renderOrdersCenter === "function") renderOrdersCenter(); }catch(err){}
  }, 0);
})();

/* extracted script block 45 */
/* ===== Step1 final click guard: one stable router for the left navigation ===== */
(function(){
  function hideRootNavFinalStep1(id){
    var el = document.getElementById(id);
    if(el) el.style.setProperty("display","none","important");
  }
  function showRootNavFinalStep1(id){
    var el = document.getElementById(id);
    if(el) el.style.setProperty("display","block","important");
  }
  function clearModesNavFinalStep1(){
    document.body.classList.remove(
      "show-cashier","show-inbound","show-stock","show-orders","show-profile-v92",
      "inventory-mode","batch-create-mode","batch-overview-mode",
      "reports-mode-step1","buyers-mode-step1"
    );
  }
  function setActiveNavFinalStep1(page){
    try{
      var nav = document.getElementById("globalUnifiedNavV41");
      if(!nav) return;
      Array.from(nav.querySelectorAll(".v41-nav-btn")).forEach(function(btn){
        var btnPage = btn.getAttribute("data-page") || (btn.getAttribute("data-config-direct") === "1" ? "configStep1" : "");
        btn.classList.toggle("active", btnPage === page);
      });
    }catch(err){}
  }
  function openBuyersNavFinalStep1(){
    ["cashierRoot","inboundRoot","stockRoot","ordersRoot","inventoryStep1Root","ownerStep1Root","reportsStep1Root","configStep1Root","profileCenterRootV92","inventoryView"].forEach(hideRootNavFinalStep1);
    clearModesNavFinalStep1();
    document.body.classList.add("buyers-mode-step1");
    if(typeof openBuyerManagerV47 === "function"){
      openBuyerManagerV47();
      setActiveNavFinalStep1("buyers");
    }else if(typeof renderBuyerManagerV47 === "function"){
      renderBuyerManagerV47();
      setActiveNavFinalStep1("buyers");
    }
  }
  window.routeTudou2NavFinalStep1 = function(page){
    if(page === "config" || page === "settings" || page === "connection") page = "configStep1";
    if(page === "profile" || page === "personalCenter") page = "profileV92";
    if(page === "inventory") page = "inventoryStep1";
    if(page === "owners" || page === "owner") page = "ownersStep1";
    if(page === "batch" || page === "inbound") page = "stock";
    if(page !== "buyers"){
      var buyerMask = document.getElementById("buyerManagerV47");
      if(buyerMask) buyerMask.classList.remove("show");
      document.body.classList.remove("buyers-mode-step1");
    }
    if(page === "buyers"){
      openBuyersNavFinalStep1();
      return false;
    }
    if(page === "reports"){
      if(typeof ensureReportsStep1Dom === "function") ensureReportsStep1Dom();
      ["cashierRoot","inboundRoot","stockRoot","ordersRoot","inventoryStep1Root","ownerStep1Root","configStep1Root","profileCenterRootV92","inventoryView"].forEach(hideRootNavFinalStep1);
      showRootNavFinalStep1("reportsStep1Root");
      clearModesNavFinalStep1();
      document.body.classList.add("reports-mode-step1");
      setActiveNavFinalStep1("reports");
      setTimeout(function(){ setActiveNavFinalStep1("reports"); }, 0);
      setTimeout(function(){ setActiveNavFinalStep1("reports"); }, 120);
      try{ if(typeof renderReportsStep1 === "function") renderReportsStep1(); }catch(err){}
      return false;
    }
    if(page === "configStep1"){
      if(typeof ensureConfigStep1Dom === "function") ensureConfigStep1Dom();
      ["cashierRoot","inboundRoot","stockRoot","ordersRoot","inventoryStep1Root","ownerStep1Root","reportsStep1Root","profileCenterRootV92","inventoryView"].forEach(hideRootNavFinalStep1);
      showRootNavFinalStep1("configStep1Root");
      clearModesNavFinalStep1();
      setActiveNavFinalStep1("configStep1");
      try{ if(typeof renderConfigStep1 === "function") renderConfigStep1(); }catch(err){}
      return false;
    }
    if(page === "profileV92"){
      if(typeof window.showProfileCenterV92 === "function") window.showProfileCenterV92();
      setTimeout(function(){ setActiveNavFinalStep1("profileV92"); }, 0);
      return false;
    }
    if(typeof showAppPage === "function"){
      showAppPage(page || "cashier");
      setTimeout(function(){ setActiveNavFinalStep1(page || "cashier"); }, 0);
    }
    return false;
  };
  if(!document.__tudou2NavFinalClickGuardStep1){
    document.__tudou2NavFinalClickGuardStep1 = true;
    document.addEventListener("click", function(ev){
      var btn = ev.target && ev.target.closest ? ev.target.closest("#globalUnifiedNavV41 .v41-nav-btn") : null;
      if(!btn) return;
      var page = btn.getAttribute("data-page") || (btn.getAttribute("data-config-direct") === "1" ? "configStep1" : "");
      if(!page) return;
      ev.preventDefault();
      ev.stopPropagation();
      if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      window.routeTudou2NavFinalStep1(page);
      return false;
    }, true);
  }
})();

/* extracted script block 46 */
/* ===== Step1 final buyer page guard: buyer manager is a page, not an overlay over orders ===== */
(function(){
  function ensureBuyerPageStyleStep1(){
    if(document.getElementById("buyerPageFinalStep1Style")) return;
    var style = document.createElement("style");
    style.id = "buyerPageFinalStep1Style";
    style.textContent = `
      body.buyers-mode-step1 #buyerManagerV47.buyer-v47-mask.show{
        display:block!important;
        position:fixed!important;
        left:74px!important;
        top:0!important;
        right:0!important;
        bottom:0!important;
        inset:0 0 0 74px!important;
        width:calc(100vw - 74px)!important;
        height:100vh!important;
        padding:0!important;
        background:#fff!important;
        z-index:1200!important;
        overflow:hidden!important;
      }
      body.buyers-mode-step1 #buyerManagerV47 .buyer-v47-modal{
        width:100%!important;
        height:100%!important;
        max-width:none!important;
        max-height:none!important;
        border-radius:0!important;
        box-shadow:none!important;
        display:grid!important;
        grid-template-columns:360px minmax(0,1fr)!important;
        overflow:hidden!important;
      }
      body.buyers-mode-step1 #buyerManagerV47 .buyer-v47-left,
      body.buyers-mode-step1 #buyerManagerV47 .buyer-v47-right{
        height:100vh!important;
        max-height:none!important;
        min-height:0!important;
        overflow:auto!important;
        -webkit-overflow-scrolling:touch;
      }
      body.buyers-mode-step1 #buyerManagerV47 .buyer-v47-right{
        padding-bottom:90px!important;
      }
      @media(max-width:980px){
        body.buyers-mode-step1 #buyerManagerV47.buyer-v47-mask.show{
          left:0!important;
          top:58px!important;
          inset:58px 0 0 0!important;
          width:100vw!important;
          height:calc(100vh - 58px)!important;
        }
        body.buyers-mode-step1 #buyerManagerV47 .buyer-v47-modal{
          grid-template-columns:1fr!important;
          overflow:auto!important;
        }
        body.buyers-mode-step1 #buyerManagerV47 .buyer-v47-left,
        body.buyers-mode-step1 #buyerManagerV47 .buyer-v47-right{
          height:auto!important;
        }
      }
    `;
    document.head.appendChild(style);
  }
  function hideRootBuyerPageStep1(id){
    var el = document.getElementById(id);
    if(el) el.style.setProperty("display","none","important");
  }
  function openBuyerPageFinalStep1(){
    ensureBuyerPageStyleStep1();
    ["cashierRoot","inboundRoot","stockRoot","ordersRoot","inventoryStep1Root","ownerStep1Root","reportsStep1Root","configStep1Root","inventoryView"].forEach(hideRootBuyerPageStep1);
    document.body.classList.remove("show-cashier","show-inbound","show-stock","show-orders","inventory-mode","batch-create-mode","batch-overview-mode","reports-mode-step1");
    document.body.classList.add("buyers-mode-step1");
    try{
      if(typeof ensureBuyerV47TempCustomer === "function") ensureBuyerV47TempCustomer();
      var mask = document.getElementById("buyerManagerV47");
      if(mask) mask.classList.add("show");
      if(typeof renderBuyerV47 === "function") renderBuyerV47();
    }catch(err){}
    try{
      var nav = document.getElementById("globalUnifiedNavV41");
      if(nav){
        Array.from(nav.querySelectorAll(".v41-nav-btn")).forEach(function(btn){
          btn.classList.toggle("active", btn.getAttribute("data-page") === "buyers");
        });
      }
    }catch(err){}
  }
  var oldOpenBuyerManagerV47FinalStep1 = typeof window.openBuyerManagerV47 === "function" ? window.openBuyerManagerV47 : null;
  window.openBuyerManagerV47 = function(){
    openBuyerPageFinalStep1();
    return false;
  };
  var oldCloseBuyerManagerV47FinalStep1 = typeof window.closeBuyerManagerV47 === "function" ? window.closeBuyerManagerV47 : null;
  window.closeBuyerManagerV47 = function(){
    var mask = document.getElementById("buyerManagerV47");
    if(mask) mask.classList.remove("show");
    document.body.classList.remove("buyers-mode-step1");
    if(typeof showAppPage === "function") showAppPage("cashier");
    return false;
  };
  var oldShowAppPageBuyerFinalStep1 = typeof window.showAppPage === "function" ? window.showAppPage : null;
  if(oldShowAppPageBuyerFinalStep1 && !oldShowAppPageBuyerFinalStep1.__buyerPageFinalStep1){
    window.showAppPage = function(page){
      if(page === "buyers"){
        openBuyerPageFinalStep1();
        return false;
      }
      var mask = document.getElementById("buyerManagerV47");
      if(mask) mask.classList.remove("show");
      document.body.classList.remove("buyers-mode-step1");
      return oldShowAppPageBuyerFinalStep1.apply(this, arguments);
    };
    window.showAppPage.__buyerPageFinalStep1 = true;
  }
  function cleanupBuyerPageFinalStep1(){
    var mask = document.getElementById("buyerManagerV47");
    if(!mask || !document.body.classList.contains("buyers-mode-step1")) return;
    var shouldStay = false;
    try{
      var active = document.querySelector("#globalUnifiedNavV41 .v41-nav-btn.active");
      shouldStay = !!(active && active.getAttribute("data-page") === "buyers");
    }catch(err){}
    var anotherPageVisible =
      document.body.classList.contains("show-cashier") ||
      document.body.classList.contains("show-stock") ||
      document.body.classList.contains("show-orders") ||
      document.body.classList.contains("inventory-mode") ||
      document.body.classList.contains("reports-mode-step1") ||
      document.getElementById("configStep1Root")?.style.display === "block";
    if(!shouldStay || anotherPageVisible){
      mask.classList.remove("show");
      document.body.classList.remove("buyers-mode-step1");
    }
  }
  setTimeout(cleanupBuyerPageFinalStep1, 0);
  setInterval(cleanupBuyerPageFinalStep1, 180);
  ensureBuyerPageStyleStep1();
})();

/* extracted script block 47 */
/* ===== Step1 final stock sync: non-fixed sold-out items must clear remaining weight ===== */
(function(){
  function normalizeSoldOutWeightStep1(){
    var changed = false;
    try{
      (Array.isArray(batches) ? batches : []).forEach(function(batch){
        (batch.items || []).forEach(function(item){
          if(!item || item.pack === "定装") return;
          var inQty = Number(item.qty || 0);
          var soldQty = Number(item.sold || 0);
          var inWeight = Number(item.weight || 0);
          var soldWeight = Number(item.soldWeight || 0);
          if(inQty > 0 && soldQty >= inQty && inWeight > 0 && soldWeight < inWeight){
            item.soldWeight = inWeight;
            changed = true;
          }
        });
      });
    }catch(err){}
    return changed;
  }
  function refreshAfterStockSyncStep1(){
    try{ if(typeof renderStockModule === "function") renderStockModule(); }catch(err){}
    try{ if(typeof renderInventoryStep1 === "function") renderInventoryStep1(); }catch(err){}
    try{ if(typeof renderInventoryView === "function") renderInventoryView(); }catch(err){}
    try{ if(typeof renderCashierBatches === "function") renderCashierBatches(); }catch(err){}
    try{ if(typeof renderCashierProducts === "function") renderCashierProducts(); }catch(err){}
  }
  function runStockSyncStep1(){
    var changed = normalizeSoldOutWeightStep1();
    if(changed){
      refreshAfterStockSyncStep1();
      try{ if(typeof tudou2SaveNow === "function") setTimeout(tudou2SaveNow, 0); }catch(err){}
    }
  }
  window.normalizeSoldOutWeightStep1 = runStockSyncStep1;
  setTimeout(runStockSyncStep1, 0);
})();

/* extracted script block 48 */
/* ===== V58 Apple UI：轻量 DOM 标记与导航统一，不接管业务流程 ===== */
(function(){
  function addClass(el, cls){
    if(el && !el.classList.contains(cls)) el.classList.add(cls);
  }
  function syncNavLabelsV58(){
    var nav = document.getElementById("globalUnifiedNavV41");
    if(!nav) return;
    var logo = nav.querySelector(".v41-logo");
    if(logo) logo.textContent = "仓頡";
    Array.from(nav.querySelectorAll(".v41-nav-btn")).forEach(function(btn){
      var text = (btn.textContent || "").trim();
      if(text === "客户") btn.textContent = "买家";
      if(text === "入库") btn.textContent = "批次";
      if(text === "配置") btn.setAttribute("aria-label","连接配置");
    });
  }
  function markPagesV58(){
    addClass(document.getElementById("cashierRoot"), "cj-apple-cashier-v58");
    addClass(document.getElementById("stockRoot"), "cj-card-stock-v58");
    addClass(document.getElementById("buyerManagerV47"), "cj-mobile-buyer-v58");
    addClass(document.getElementById("configStep1Root"), "cj-printer-config-v58");
  }
  function annotateStockCardsV58(){
    var wrap = document.getElementById("stockTableWrap");
    if(!wrap) return;
    Array.from(wrap.querySelectorAll(".stock-table tbody tr")).forEach(function(row){
      if(row.getAttribute("data-cj-v58")) return;
      row.setAttribute("data-cj-v58","card");
      var stateCell = row.children && row.children[6];
      if(stateCell){
        var state = (stateCell.textContent || "").trim();
        row.setAttribute("data-stock-state", state);
      }
    });
  }
  function enhanceV58(){
    syncNavLabelsV58();
    markPagesV58();
    annotateStockCardsV58();
  }
  ["renderStockModule","renderCashierAll","renderCashierProducts","renderBuyerV47","renderConfigStep1"].forEach(function(name){
    var fn = window[name];
    if(typeof fn === "function" && !fn.__cangjieAppleV58Wrapped){
      window[name] = function(){
        var result = fn.apply(this, arguments);
        setTimeout(enhanceV58, 0);
        return result;
      };
      window[name].__cangjieAppleV58Wrapped = true;
    }
  });
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", enhanceV58);
  }else{
    enhanceV58();
  }
  setTimeout(enhanceV58, 120);
  setInterval(enhanceV58, 1200);
})();

/* extracted script block 49 */
/* ===== V59：修复 prompt() unsupported，只替换输入入口，不改 V57 数据逻辑 ===== */
(function(){
  function escV59(v){
    return String(v == null ? "" : v).replace(/[&<>"']/g, function(m){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m];
    });
  }
  function saveV59(){
    try{ if(typeof tudou2SaveNow === "function") setTimeout(tudou2SaveNow, 0); }catch(err){}
  }
  function refreshCommonV59(){
    try{ if(typeof renderAll === "function") renderAll(); }catch(err){}
    try{ if(typeof renderCashierCustomers === "function") renderCashierCustomers(); }catch(err){}
    try{ if(typeof renderCurrentCodeBill === "function") renderCurrentCodeBill(); }catch(err){}
    try{ if(typeof renderBuyerV47 === "function") renderBuyerV47(); }catch(err){}
    saveV59();
  }
  function ensureInputModalV59(){
    var mask = document.getElementById("cjPromptFixV59");
    if(mask) return mask;
    mask = document.createElement("div");
    mask.id = "cjPromptFixV59";
    mask.className = "cj-v59-input-mask";
    mask.innerHTML = '<div class="cj-v59-input-modal" role="dialog" aria-modal="true">'
      + '<div class="cj-v59-input-head"><h3 id="cjPromptFixTitleV59">输入</h3><p id="cjPromptFixSubV59">请填写内容后确认。</p></div>'
      + '<div class="cj-v59-input-body" id="cjPromptFixBodyV59"></div>'
      + '<div class="cj-v59-input-actions"><button class="cj-v59-input-cancel" type="button" id="cjPromptFixCancelV59">取消</button><button class="cj-v59-input-ok" type="button" id="cjPromptFixOkV59">确认</button></div>'
      + '</div>';
    document.body.appendChild(mask);
    return mask;
  }
  window.cangjieInputV59 = function(options){
    options = options || {};
    return new Promise(function(resolve){
      var mask = ensureInputModalV59();
      var title = document.getElementById("cjPromptFixTitleV59");
      var sub = document.getElementById("cjPromptFixSubV59");
      var body = document.getElementById("cjPromptFixBodyV59");
      var ok = document.getElementById("cjPromptFixOkV59");
      var cancel = document.getElementById("cjPromptFixCancelV59");
      var isText = options.type === "textarea";
      title.textContent = options.title || "输入";
      sub.textContent = options.sub || "请填写内容后确认。";
      body.innerHTML = isText
        ? '<textarea id="cjPromptFixFieldV59"></textarea>'
        : '<input id="cjPromptFixFieldV59" type="'+escV59(options.inputType || "text")+'">';
      var field = document.getElementById("cjPromptFixFieldV59");
      field.value = options.value == null ? "" : String(options.value);
      function close(value){
        mask.classList.remove("show");
        ok.onclick = null;
        cancel.onclick = null;
        mask.onclick = null;
        document.onkeydown = oldKeydown;
        resolve(value);
      }
      var oldKeydown = document.onkeydown;
      ok.onclick = function(){ close(field.value); };
      cancel.onclick = function(){ close(null); };
      mask.onclick = function(ev){ if(ev.target === mask) close(null); };
      document.onkeydown = function(ev){
        if(ev.key === "Escape"){ ev.preventDefault(); close(null); return; }
        if(ev.key === "Enter" && !isText){ ev.preventDefault(); close(field.value); return; }
        if(typeof oldKeydown === "function") return oldKeydown.call(document, ev);
      };
      mask.classList.add("show");
      setTimeout(function(){ try{ field.focus(); field.select(); }catch(err){} }, 0);
    });
  };

  window.addOwnerFromBatchModal = async function(){
    var name = await window.cangjieInputV59({title:"新增货主", sub:"新增后会自动选中该货主。"});
    if(name == null) return;
    var clean = String(name).trim();
    if(!clean) return;
    if(typeof owners !== "undefined" && Array.isArray(owners) && !owners.includes(clean)) owners.push(clean);
    if(typeof renderOwnerOptions === "function") renderOwnerOptions();
    var sel = document.getElementById("batchOwnerSelect");
    if(sel) sel.value = clean;
    if(typeof refreshBatchPreview === "function") refreshBatchPreview();
    saveV59();
    if(typeof toast === "function") toast("货主已新增");
  };

  window.renameBatch = async function(){
    if(typeof activeBatch !== "function") return;
    var batch = activeBatch();
    if(!batch) return;
    var owner = await window.cangjieInputV59({title:"修改货主名称", value:batch.owner || ""});
    if(owner == null) return;
    owner = String(owner).trim();
    if(!owner) return;
    var no = await window.cangjieInputV59({title:"修改批次号", value:batch.no || ""});
    if(no == null) return;
    no = String(no).trim();
    if(!no) return;
    batch.owner = owner;
    if(typeof owners !== "undefined" && Array.isArray(owners) && !owners.includes(owner)) owners.push(owner);
    batch.no = no;
    refreshCommonV59();
    if(typeof toast === "function") toast("批次已修改");
  };

  window.addFee = async function(){
    if(typeof activeBatch !== "function") return;
    var b = activeBatch();
    var val = await window.cangjieInputV59({title:"费用金额", sub:"填写当前批次的费用金额。", value:String((b && b.fee) || 0), inputType:"number"});
    if(val == null) return;
    if(b) b.fee = Number(val || 0);
    if(typeof renderDetail === "function") renderDetail();
    saveV59();
    if(typeof toast === "function") toast("费用已更新");
  };

  window.addRemark = async function(){
    if(typeof activeBatch !== "function") return;
    var b = activeBatch();
    var val = await window.cangjieInputV59({title:"批次备注", sub:"备注会保存在当前批次中。", value:(b && b.remark) || "", type:"textarea"});
    if(val == null) return;
    if(b) b.remark = val;
    saveV59();
    if(typeof toast === "function") toast("备注已保存");
  };

  window.addCategory = async function(){
    var name = await window.cangjieInputV59({title:"新增分类", sub:"新增后会自动选中该分类。"});
    if(name == null) return;
    var clean = String(name).trim();
    if(!clean) return;
    if(typeof productCategories !== "undefined" && Array.isArray(productCategories) && !productCategories.includes(clean)) productCategories.push(clean);
    if(typeof fillCategoryOptions === "function") fillCategoryOptions();
    var sel = document.getElementById("gmCategory");
    if(sel) sel.value = clean;
    saveV59();
    if(typeof toast === "function") toast("分类已新增");
  };

  window.addCashierCustomer = async function(){
    var name = await window.cangjieInputV59({title:"新增买家", sub:"新增后会自动设为当前收银买家。"});
    if(name == null) return;
    var clean = String(name).trim();
    if(!clean) return;
    var list = (typeof cashierCustomers !== "undefined" && Array.isArray(cashierCustomers)) ? cashierCustomers : [];
    var existed = list.find(function(c){ return c && c.name === clean && !c.disabled; });
    var c = existed || {id:"c" + Date.now(), name:clean, debt:0, payments:[], parentId:"", disabled:false};
    if(!existed) list.push(c);
    if(typeof renderCashierCustomers === "function") renderCashierCustomers();
    var sel = document.getElementById("cashierCustomer");
    if(sel) sel.value = c.id;
    try{ selectedBuyerV47Id = c.id; }catch(err){}
    try{ window.selectedCashierCustomerIdV116 = c.id; }catch(err){}
    try{ if(typeof window.syncCustomerStateV116 === "function") window.syncCustomerStateV116(c.id); }catch(err){}
    try{ window.currentBuyer = c; window.selectedBuyer = c; }catch(err){}
    if(typeof handleCustomerOrPayChange === "function") handleCustomerOrPayChange();
    else if(typeof renderCurrentCodeBill === "function") renderCurrentCodeBill();
    try{ if(typeof renderBuyerV47 === "function") renderBuyerV47(); }catch(err){}
    saveV59();
    if(typeof toast === "function") toast(existed ? "买家已存在，已选中" : "买家已新增");
  };

  window.addBuyerV47 = async function(){
    var name = await window.cangjieInputV59({title:"新增买家", sub:"正式买家可收银、赊欠和还款。"});
    if(name == null) return;
    var clean = String(name).trim();
    if(!clean) return;
    var list = (typeof cashierCustomers !== "undefined" && Array.isArray(cashierCustomers)) ? cashierCustomers : [];
    var existed = list.find(function(c){ return c && c.name === clean && !c.disabled; });
    if(existed){
      selectedBuyerV47Id = existed.id;
      if(typeof renderBuyerV47 === "function") renderBuyerV47();
      if(typeof toast === "function") toast("买家已存在，已为你选中");
      return;
    }
    var c = {id:"c" + Date.now(), name:clean, debt:0, payments:[], parentId:"", disabled:false};
    list.push(c);
    selectedBuyerV47Id = c.id;
    refreshCommonV59();
    if(typeof toast === "function") toast("买家已新增");
  };

  window.addSubBuyerV47Step1 = async function(){
    var list = (typeof cashierCustomers !== "undefined" && Array.isArray(cashierCustomers)) ? cashierCustomers : [];
    var parent = list.find(function(c){ return c && c.id === (typeof selectedBuyerV47Id !== "undefined" ? selectedBuyerV47Id : ""); });
    if(!parent || parent.id === "c1" || parent.name === "临时客户" || parent.parentId){
      alert("请先选择一个正式主买家。");
      return;
    }
    var name = await window.cangjieInputV59({title:"新增门店", sub:"门店会关联到当前主买家：" + parent.name});
    if(name == null) return;
    var clean = String(name).trim();
    if(!clean) return;
    var existed = list.find(function(c){ return c && c.name === clean; });
    if(existed) existed.parentId = parent.id;
    else list.push({id:"c" + Date.now(), name:clean, debt:0, payments:[], parentId:parent.id, disabled:false});
    refreshCommonV59();
    if(typeof toast === "function") toast("门店已关联到：" + parent.name);
  };

  window.linkExistingSubBuyerV47Step1 = async function(){
    var list = (typeof cashierCustomers !== "undefined" && Array.isArray(cashierCustomers)) ? cashierCustomers : [];
    var parent = list.find(function(c){ return c && c.id === (typeof selectedBuyerV47Id !== "undefined" ? selectedBuyerV47Id : ""); });
    if(!parent || parent.id === "c1" || parent.name === "临时客户" || parent.parentId){
      alert("请先选择一个正式主买家。");
      return;
    }
    var name = await window.cangjieInputV59({title:"关联已有买家", sub:"输入已有买家的完整名称。"});
    if(name == null) return;
    var clean = String(name).trim();
    var child = list.find(function(c){ return c && c.name === clean; });
    if(!child){ alert("没有找到这个买家。"); return; }
    if(child.id === parent.id){ alert("不能把主买家关联到自己名下。"); return; }
    child.parentId = parent.id;
    refreshCommonV59();
    if(typeof toast === "function") toast("已关联门店：" + child.name);
  };

  window.prompt = function(message, value){
    console.warn("仓頡 V59 已拦截原生 prompt，请使用页面内输入弹窗入口：", message);
    return value == null ? "" : String(value);
  };
})();

/* extracted script block 50 */
/* ===== V61：捕获旧 onclick，确保不再触发原生 prompt ===== */
(function(){
  if(document.__cangjiePromptClickGuardV61) return;
  document.__cangjiePromptClickGuardV61 = true;
  function textOf(el){
    return String((el && el.textContent) || "").replace(/\s+/g,"").trim();
  }
  function callByName(name){
    var fn = window[name];
    if(typeof fn === "function"){
      try{ fn(); }catch(err){ console.error("V61 input route failed:", name, err); }
      return true;
    }
    return false;
  }
  document.addEventListener("click", function(ev){
    var el = ev.target && ev.target.closest ? ev.target.closest("button,[onclick]") : null;
    if(!el) return;
    var code = String(el.getAttribute("onclick") || "");
    var txt = textOf(el);
    var route = "";
    if(code.indexOf("addCategory") >= 0 || txt === "新增分类") route = "addCategory";
    else if(code.indexOf("addOwnerFromBatchModal") >= 0 || txt === "新增货主") route = "addOwnerFromBatchModal";
    else if(code.indexOf("renameBatch") >= 0 || txt === "改名" || txt === "修改批次") route = "renameBatch";
    else if(code.indexOf("addFee") >= 0 || txt === "费用") route = "addFee";
    else if(code.indexOf("addRemark") >= 0 || txt === "备注") route = "addRemark";
    else if(code.indexOf("addCashierCustomer") >= 0 || txt === "新增买家") route = "addCashierCustomer";
    else if(code.indexOf("addBuyerV47") >= 0 || txt === "新增正式买家") route = "addBuyerV47";
    else if(code.indexOf("addSubBuyerV47Step1") >= 0 || txt === "新增门店") route = "addSubBuyerV47Step1";
    else if(code.indexOf("linkExistingSubBuyerV47Step1") >= 0 || txt === "关联已有买家") route = "linkExistingSubBuyerV47Step1";
    if(!route) return;
    ev.preventDefault();
    ev.stopPropagation();
    if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    callByName(route);
    return false;
  }, true);
})();

/* extracted script block 51 */
/* ===== V62：给动态模块补标记，不接管业务 ===== */
(function(){
  function markV62(){
    try{
      document.querySelectorAll(".owner-step1-tabs button,.reports-step1-tabs button").forEach(function(btn){
        btn.setAttribute("data-cj-v62","segmented");
      });
      document.querySelectorAll(".batch-modal-v45 button,.owner-step1-actions button,.owner-step1-actions a,.reports-step1-filters button").forEach(function(btn){
        btn.setAttribute("data-cj-v62","button");
      });
    }catch(err){}
  }
  ["renderOwnerStep1","renderReportsStep1","renderInventoryStep1","openBatchModal","openBatchCreateFlow","renderStockModule","renderOrdersCenter","renderOrderDetail"].forEach(function(name){
    var fn = window[name];
    if(typeof fn === "function" && !fn.__cangjieV62Wrapped){
      window[name] = function(){
        var result = fn.apply(this, arguments);
        setTimeout(markV62, 0);
        return result;
      };
      window[name].__cangjieV62Wrapped = true;
    }
  });
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", markV62);
  else markV62();
  setTimeout(markV62, 120);
  setInterval(markV62, 1500);
})();

/* extracted script block 52 */
/* ===== V81：订单详情直接还款，不改底层订单/库存框架 ===== */
(function(){
  var activeOrderRepayV81 = "";

  function numOrderRepayV81(v){ return Number(v || 0) || 0; }
  function moneyOrderRepayV81(v){
    return typeof money === "function" ? money(v) : numOrderRepayV81(v).toFixed(2);
  }
  function escOrderRepayV81(v){
    return typeof esc === "function" ? esc(v) : String(v ?? "").replace(/[&<>"']/g, function(m){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m];
    });
  }
  function orderKeyRepayV81(order){
    return String((order && (order.orderNo || order.billNo || order.id)) || "");
  }
  function orderRowsRepayV81(){
    return (typeof finalOrders !== "undefined" && Array.isArray(finalOrders)) ? finalOrders : [];
  }
  function buyerRowsRepayV81(){
    return (typeof cashierCustomers !== "undefined" && Array.isArray(cashierCustomers)) ? cashierCustomers : [];
  }
  function findOrderRepayV81(key){
    var want = String(key || "");
    return orderRowsRepayV81().find(function(order){ return orderKeyRepayV81(order) === want; }) || null;
  }
  function selectedOrderRepayV81(){
    try{
      var selected = typeof currentSelectedOrderRecord === "function" ? currentSelectedOrderRecord() : null;
      return selected ? findOrderRepayV81(orderKeyRepayV81(selected)) : null;
    }catch(err){
      return null;
    }
  }
  function isVoidRepayV81(order){
    return !!(order && (order.voided || order.status === "已作废" || order.displayStatus === "已作废"));
  }
  function paidRepayV81(order){
    if(!order) return 0;
    if(typeof buyerV47PaidAmount === "function") return numOrderRepayV81(buyerV47PaidAmount(order));
    return numOrderRepayV81(order && order.paid);
  }
  function debtRepayV81(order){
    if(!order) return 0;
    if(typeof buyerV47DebtAmount === "function") return numOrderRepayV81(buyerV47DebtAmount(order));
    return Math.max(numOrderRepayV81(order && order.debt), 0);
  }
  function paymentsRepayV81(order){
    return Array.isArray(order && order.payments) ? order.payments : [];
  }
  function findBuyerRepayV81(order){
    if(!order) return null;
    return buyerRowsRepayV81().find(function(buyer){
      return buyer && (buyer.id === order.customerId || buyer.name === order.customerName);
    }) || null;
  }
  function setOrderTextRepayV81(order){
    if(!order) return;
    var lines = (order.lines || []).map(function(i, idx){
      return (idx + 1) + ". " + (i.name || i.goodsName || "") + "｜" + (i.owner || "") + (i.batchNo || "") + "｜" + (i.type || "") + "｜" + numOrderRepayV81(i.qty) + (i.unit || "件") + "｜" + numOrderRepayV81(i.weight) + "斤｜" + moneyOrderRepayV81(i.price) + "元/" + ((i.type || "") === "定装" ? "件" : "斤") + "｜" + moneyOrderRepayV81(i.amount);
    });
    var text = [
      "仓頡订单",
      "订单号：" + orderKeyRepayV81(order),
      "客户：" + (order.customerName || ""),
      "时间：" + (order.time || ""),
      "----------------",
      lines.join("\n"),
      "----------------",
      "总数量：" + numOrderRepayV81(order.totalQty),
      "总重量：" + numOrderRepayV81(order.totalWeight) + "斤",
      "原金额：" + moneyOrderRepayV81(order.originalAmount || order.totalAmount),
      "优惠：" + moneyOrderRepayV81(order.discount || 0) + (order.discountNote ? "（" + order.discountNote + "）" : ""),
      "应收金额：" + moneyOrderRepayV81(order.totalAmount),
      "实收/已还：" + moneyOrderRepayV81(paidRepayV81(order)),
      "欠款：" + moneyOrderRepayV81(debtRepayV81(order))
    ].join("\n");
    if(order.orderRemark || order.remark) text += "\n订单备注：" + (order.orderRemark || order.remark);
    var pays = paymentsRepayV81(order);
    if(pays.length){
      text += "\n----------------\n还款记录：";
      pays.forEach(function(pay, idx){
        text += "\n" + (idx + 1) + ". " + (pay.time || "") + "｜" + moneyOrderRepayV81(pay.amount) + "｜" + (pay.method || "") + (pay.remark ? "｜" + pay.remark : "");
      });
    }
    order.text = text;
  }
  function refreshOrderRepayV81(order){
    try{
      var buyer = findBuyerRepayV81(order);
      if(buyer && typeof recalcBuyerV47Debt === "function") recalcBuyerV47Debt(buyer.id);
    }catch(err){}
    try{ if(typeof renderOrdersCenter === "function") renderOrdersCenter(); }catch(err){}
    try{ if(typeof renderBuyerV47 === "function") renderBuyerV47(); }catch(err){}
    try{ if(typeof renderCashierCustomers === "function") renderCashierCustomers(); }catch(err){}
    try{ if(typeof renderReportsStep1 === "function") renderReportsStep1(); }catch(err){}
    try{ if(typeof renderOwnerStep1 === "function") renderOwnerStep1(); }catch(err){}
    try{ if(typeof tudou2SaveNow === "function") setTimeout(tudou2SaveNow, 0); }catch(err){}
  }
  function ensureOrderRepayV81Dom(){
    if(document.getElementById("orderRepayV81Mask")) return;
    var mask = document.createElement("div");
    mask.id = "orderRepayV81Mask";
    mask.className = "order-repay-v81-mask";
    mask.innerHTML = '<div class="order-repay-v81-modal">'
      + '<div class="order-repay-v81-head"><div><h3>订单还款</h3><p id="orderRepayV81Sub">记录该订单的本次还款</p></div><button class="order-repay-v81-close" type="button" onclick="closeOrderRepayV81()">×</button></div>'
      + '<div class="order-repay-v81-body">'
      + '<input id="orderRepayV81OrderNo" type="hidden">'
      + '<div class="order-repay-v81-summary"><div><span>订单</span><b id="orderRepayV81No">-</b></div><div><span>客户</span><b id="orderRepayV81Buyer">-</b></div><div><span>订单金额</span><b id="orderRepayV81Total">0.00</b></div><div><span>剩余欠款</span><b id="orderRepayV81Debt">0.00</b></div></div>'
      + '<div class="order-repay-v81-field"><label>本次还款</label><input id="orderRepayV81Amount" type="number" min="0" step="0.01" inputmode="decimal"></div>'
      + '<div class="order-repay-v81-field"><label>收款方式</label><select id="orderRepayV81Method"><option value="现金">现金</option><option value="微信">微信</option><option value="支付宝">支付宝</option><option value="银行卡">银行卡</option><option value="其他">其他</option></select></div>'
      + '<div class="order-repay-v81-field"><label>备注</label><textarea id="orderRepayV81Remark" placeholder="可不填"></textarea></div>'
      + '<div class="order-repay-v81-actions"><button class="order-repay-v81-cancel" type="button" onclick="closeOrderRepayV81()">取消</button><button class="order-repay-v81-confirm" type="button" onclick="confirmOrderRepayV81()">确认还款</button></div>'
      + '</div></div>';
    mask.addEventListener("click", function(ev){ if(ev.target === mask) window.closeOrderRepayV81(); });
    document.body.appendChild(mask);
  }
  function decorateOrderDetailRepayV81(order){
    var box = document.getElementById("ordersDetailBody");
    if(!box || !order || isVoidRepayV81(order)) return;
    if(box.querySelector(".order-repay-v81-strip")) return;
    var debt = debtRepayV81(order);
    var strip = document.createElement("div");
    strip.className = "order-repay-v81-strip";
    strip.innerHTML = '<div class="order-repay-v81-cell"><span>订单金额</span><b>'+moneyOrderRepayV81(order.totalAmount || 0)+'</b></div>'
      + '<div class="order-repay-v81-cell"><span>已收/已还</span><b>'+moneyOrderRepayV81(paidRepayV81(order))+'</b></div>'
      + '<div class="order-repay-v81-cell debt"><span>剩余欠款</span><b>'+moneyOrderRepayV81(debt)+'</b></div>'
      + '<button class="order-repay-v81-action" type="button" '+(debt > 0 ? 'onclick="openOrderRepayV81()"' : "disabled")+'>'+(debt > 0 ? "还款" : "已结清")+'</button>';
    var grid = box.querySelector(".order-info-grid");
    if(grid && grid.parentNode) grid.parentNode.insertBefore(strip, grid.nextSibling);
  }
  function ensureOrderRepayButtonV81(){
    var actions = document.querySelector("#ordersRoot .orders-detail-actions");
    if(!actions) return;
    var order = selectedOrderRepayV81();
    var debt = debtRepayV81(order);
    var btn = document.getElementById("orderRepayV81Btn");
    if(!order || isVoidRepayV81(order) || debt <= 0){
      if(btn) btn.remove();
      return;
    }
    if(!btn){
      btn = document.createElement("button");
      btn.id = "orderRepayV81Btn";
      btn.type = "button";
      btn.className = "btn-blue";
      btn.textContent = "还款";
      btn.onclick = function(){ window.openOrderRepayV81(); };
      var edit = document.getElementById("orderEditStep1Btn");
      if(edit && edit.nextSibling) actions.insertBefore(btn, edit.nextSibling);
      else actions.insertBefore(btn, actions.firstChild);
    }
  }
  window.openOrderRepayV81 = function(orderNo){
    ensureOrderRepayV81Dom();
    var order = orderNo ? findOrderRepayV81(orderNo) : selectedOrderRepayV81();
    if(!order){
      if(typeof toast === "function") toast("请先选择一张订单");
      return;
    }
    if(isVoidRepayV81(order)){
      if(typeof toast === "function") toast("已作废订单不能还款");
      return;
    }
    var debt = debtRepayV81(order);
    if(debt <= 0){
      if(typeof toast === "function") toast("该订单已结清");
      return;
    }
    activeOrderRepayV81 = orderKeyRepayV81(order);
    document.getElementById("orderRepayV81OrderNo").value = activeOrderRepayV81;
    document.getElementById("orderRepayV81No").textContent = activeOrderRepayV81;
    document.getElementById("orderRepayV81Buyer").textContent = order.customerName || "-";
    document.getElementById("orderRepayV81Total").textContent = moneyOrderRepayV81(order.totalAmount || 0);
    document.getElementById("orderRepayV81Debt").textContent = moneyOrderRepayV81(debt);
    document.getElementById("orderRepayV81Amount").value = debt.toFixed(2);
    document.getElementById("orderRepayV81Remark").value = "";
    document.getElementById("orderRepayV81Mask").classList.add("show");
    setTimeout(function(){ document.getElementById("orderRepayV81Amount")?.focus(); }, 30);
  };
  window.closeOrderRepayV81 = function(){
    var mask = document.getElementById("orderRepayV81Mask");
    if(mask) mask.classList.remove("show");
  };
  window.confirmOrderRepayV81 = function(){
    var orderNo = document.getElementById("orderRepayV81OrderNo")?.value || activeOrderRepayV81;
    var order = findOrderRepayV81(orderNo);
    if(!order){
      alert("没有找到对应订单。");
      return;
    }
    var amount = numOrderRepayV81(document.getElementById("orderRepayV81Amount")?.value);
    var debtBefore = debtRepayV81(order);
    if(amount <= 0){
      alert("请输入正确的还款金额。");
      return;
    }
    if(amount > debtBefore){
      alert("还款金额不能大于该订单剩余欠款。");
      return;
    }
    var pay = {
      id:"pay_order_" + Date.now(),
      time:new Date().toLocaleString("zh-CN",{hour12:false}),
      amount:amount,
      method:document.getElementById("orderRepayV81Method")?.value || "现金",
      remark:(document.getElementById("orderRepayV81Remark")?.value || "").trim(),
      orderNo:orderNo
    };
    if(!Array.isArray(order.payments)) order.payments = [];
    order.payments.push(pay);
    order.paid = numOrderRepayV81(order.paid) + amount;
    order.debt = Math.max(0, debtBefore - amount);
    if(order.debt <= 0){
      order.status = "已结清";
      order.displayStatus = "已结清";
    }else{
      order.status = "部分还款";
      order.displayStatus = "部分还款";
    }
    var buyer = findBuyerRepayV81(order);
    if(buyer){
      if(!Array.isArray(buyer.payments)) buyer.payments = [];
      buyer.payments.push(Object.assign({}, pay));
      if(typeof recalcBuyerV47Debt === "function") recalcBuyerV47Debt(buyer.id);
      else buyer.debt = Math.max(numOrderRepayV81(buyer.debt) - amount, 0);
    }
    setOrderTextRepayV81(order);
    window.closeOrderRepayV81();
    refreshOrderRepayV81(order);
    if(typeof toast === "function") toast("订单还款已记录");
  };

  var oldRenderOrderDetailRepayV81 = typeof window.renderOrderDetail === "function" ? window.renderOrderDetail : null;
  if(oldRenderOrderDetailRepayV81 && !oldRenderOrderDetailRepayV81.__orderRepayV81Wrapped){
    window.renderOrderDetail = function(order){
      var result = oldRenderOrderDetailRepayV81.apply(this, arguments);
      setTimeout(function(){
        var realOrder = order ? findOrderRepayV81(orderKeyRepayV81(order)) || order : null;
        decorateOrderDetailRepayV81(realOrder);
        ensureOrderRepayButtonV81();
      }, 0);
      return result;
    };
    window.renderOrderDetail.__orderRepayV81Wrapped = true;
  }
  var oldRenderOrdersCenterRepayV81 = typeof window.renderOrdersCenter === "function" ? window.renderOrdersCenter : null;
  if(oldRenderOrdersCenterRepayV81 && !oldRenderOrdersCenterRepayV81.__orderRepayV81Wrapped){
    window.renderOrdersCenter = function(){
      var result = oldRenderOrdersCenterRepayV81.apply(this, arguments);
      setTimeout(function(){
        decorateOrderDetailRepayV81(selectedOrderRepayV81());
        ensureOrderRepayButtonV81();
      }, 0);
      return result;
    };
    window.renderOrdersCenter.__orderRepayV81Wrapped = true;
  }
  setTimeout(function(){
    ensureOrderRepayV81Dom();
    decorateOrderDetailRepayV81(selectedOrderRepayV81());
    ensureOrderRepayButtonV81();
  }, 0);
})();

/* extracted script block 53 */
/* ===== V82：收银台点击主买家展开门店，底层仍写入 cashierCustomer ===== */
(function(){
  var expandedBuyerTreeV82 = {};

  function buyersTreeV82(){
    return (typeof cashierCustomers !== "undefined" && Array.isArray(cashierCustomers)) ? cashierCustomers : [];
  }
  function escTreeV82(v){
    return typeof esc === "function" ? esc(v) : String(v ?? "").replace(/[&<>"']/g, function(m){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m];
    });
  }
  function moneyTreeV82(v){ return typeof money === "function" ? money(v) : (Number(v || 0) || 0).toFixed(2); }
  function isTempTreeV82(c){ return !c || c.id === "c1" || c.name === "临时客户" || String(c.name || "").startsWith("临时客户"); }
  function isDisabledTreeV82(c){ return !!(c && c.disabled); }
  function activeBuyersTreeV82(){
    return buyersTreeV82().filter(function(c){ return c && (!isDisabledTreeV82(c) || isTempTreeV82(c)); });
  }
  function buyerByIdTreeV82(id){
    return buyersTreeV82().find(function(c){ return c && c.id === id; }) || null;
  }
  function childrenTreeV82(parentId){
    return activeBuyersTreeV82().filter(function(c){ return c && c.parentId === parentId; });
  }
  function currentIdTreeV82(){
    var sel = document.getElementById("cashierCustomer");
    return sel ? sel.value : "";
  }
  function labelTreeV82(c){
    if(!c) return "选择买家";
    var parent = c.parentId ? buyerByIdTreeV82(c.parentId) : null;
    return parent ? parent.name + " / " + c.name : c.name;
  }
  function metaTreeV82(c, childCount){
    var bits = [];
    if(childCount) bits.push(childCount + "门店");
    if(Number(c && c.debt || 0) > 0) bits.push("欠" + moneyTreeV82(c.debt));
    return bits.join("｜");
  }
  function ensureTreeV82(){
    var sel = document.getElementById("cashierCustomer");
    if(!sel) return null;
    var wrap = document.getElementById("cashierBuyerTreeV82");
    if(!wrap){
      wrap = document.createElement("div");
      wrap.id = "cashierBuyerTreeV82";
      wrap.className = "cashier-buyer-tree-v82";
      wrap.innerHTML = '<button id="cashierBuyerTreeTriggerV82" class="cashier-buyer-tree-trigger-v82" type="button"><span>选择买家</span><em>⌄</em></button><div id="cashierBuyerTreePanelV82" class="cashier-buyer-tree-panel-v82"></div>';
      sel.parentNode.insertBefore(wrap, sel);
      wrap.querySelector("#cashierBuyerTreeTriggerV82").addEventListener("click", function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        renderTreeV82();
        wrap.classList.toggle("open");
      });
    }
    sel.classList.add("cashier-buyer-tree-native-v82");
    return wrap;
  }
  function nativeOptionRefreshTreeV82(){
    var sel = document.getElementById("cashierCustomer");
    if(!sel) return;
    var old = sel.value;
    var active = activeBuyersTreeV82();
    sel.innerHTML = active.map(function(c){
      return '<option value="'+escTreeV82(c.id)+'">'+escTreeV82(c.name)+(Number(c.debt || 0) > 0 ? "｜欠" + moneyTreeV82(c.debt) : "")+'</option>';
    }).join("");
    if(active.some(function(c){ return c.id === old; })) sel.value = old;
    else if(active[0]) sel.value = active[0].id;
  }
  function rowTreeV82(c, cls, arrow, meta){
    var selected = c.id === currentIdTreeV82();
    return '<div role="button" tabindex="0" class="cashier-buyer-tree-row-v82 '+cls+(selected ? ' active' : '')+'" data-buyer-tree-v82="'+escTreeV82(c.id)+'" onpointerdown="window.selectCashierBuyerTreeV82(\''+escTreeV82(c.id)+'\');return false;" onclick="window.selectCashierBuyerTreeV82(\''+escTreeV82(c.id)+'\');return false;">'
      + '<span class="arrow">'+arrow+'</span>'
      + '<span class="name">'+escTreeV82(c.name)+'</span>'
      + '<span class="meta">'+escTreeV82(meta || "")+'</span>'
      + '</div>';
  }
  function renderTreeV82(){
    var wrap = ensureTreeV82();
    if(!wrap) return;
    nativeOptionRefreshTreeV82();
    var sel = document.getElementById("cashierCustomer");
    var selected = buyerByIdTreeV82(sel ? sel.value : "");
    if(selected && selected.parentId) expandedBuyerTreeV82[selected.parentId] = true;
    var trigger = document.getElementById("cashierBuyerTreeTriggerV82");
    if(trigger){
      trigger.querySelector("span").textContent = labelTreeV82(selected);
      trigger.querySelector("em").textContent = wrap.classList.contains("open") ? "⌃" : "⌄";
    }
    var panel = document.getElementById("cashierBuyerTreePanelV82");
    if(!panel) return;
    var active = activeBuyersTreeV82();
    var top = active.filter(function(c){ return !c.parentId; });
    var html = "";
    top.forEach(function(c){
      var children = childrenTreeV82(c.id);
      if(isTempTreeV82(c)) html += '<div class="cashier-buyer-tree-section-v82">临时</div>';
      var cls = isTempTreeV82(c) ? "temp" : "parent";
      var isExpanded = children.length ? expandedBuyerTreeV82[c.id] !== false : false;
      var arrow = children.length ? (isExpanded ? "⌄" : "›") : "•";
      html += rowTreeV82(c, cls, arrow, metaTreeV82(c, children.length));
      if(children.length && isExpanded){
        html += '<div role="button" tabindex="0" class="cashier-buyer-tree-row-v82 child self'+(c.id === currentIdTreeV82() ? ' active' : '')+'" data-buyer-tree-direct-v82="'+escTreeV82(c.id)+'" onpointerdown="window.pickCashierBuyerDirectV82(\''+escTreeV82(c.id)+'\');return false;" onclick="window.pickCashierBuyerDirectV82(\''+escTreeV82(c.id)+'\');return false;">'
          + '<span class="arrow">✓</span><span class="name">'+escTreeV82(c.name)+'</span><span class="meta">选择主账</span></div>';
        children.forEach(function(child){
          html += rowTreeV82(child, "child", "↳", metaTreeV82(child, 0));
        });
      }
    });
    panel.innerHTML = html || '<div class="cashier-buyer-tree-section-v82">暂无可选买家</div>';
  }
  function applyBuyerTreeV82(buyer){
    var sel = document.getElementById("cashierCustomer");
    if(!buyer || !sel) return;
    sel.value = buyer.id;
    try{ window.selectedCashierCustomerIdV116 = buyer.id; }catch(err){}
    try{ localStorage.setItem('CANGJIE_SELECTED_CUSTOMER_V116', buyer.id); }catch(err){}
    try{ if(typeof window.syncCustomerStateV116 === "function") window.syncCustomerStateV116(buyer.id); }catch(err){}
    try{ if(typeof handleCustomerOrPayChange === "function") handleCustomerOrPayChange(); }catch(err){}
    try{ if(typeof enforceTemporaryCustomerRule === "function") enforceTemporaryCustomerRule(); }catch(err){}
    try{ if(typeof renderCurrentCodeBill === "function") renderCurrentCodeBill(); }catch(err){}
    try{ if(typeof renderCashierProducts === "function") renderCashierProducts(); }catch(err){}
    try{ if(typeof renderCashierCustomerTabsStep1 === "function") renderCashierCustomerTabsStep1(); }catch(err){}
  }
  function selectBuyerTreeV82(id){
    var buyer = buyerByIdTreeV82(id);
    var sel = document.getElementById("cashierCustomer");
    if(!buyer || !sel) return;
    var kids = childrenTreeV82(buyer.id);
    if(kids.length && !buyer.parentId && !isTempTreeV82(buyer)){
      expandedBuyerTreeV82[buyer.id] = expandedBuyerTreeV82[buyer.id] === false;
      var keepOpen = document.getElementById("cashierBuyerTreeV82");
      if(keepOpen) keepOpen.classList.add("open");
      renderTreeV82();
      setTimeout(function(){
        var again = document.getElementById("cashierBuyerTreeV82");
        if(again) again.classList.add("open");
        renderTreeV82();
      }, 0);
      return;
    }
    applyBuyerTreeV82(buyer);
    var wrap = document.getElementById("cashierBuyerTreeV82");
    if(wrap) wrap.classList.remove("open");
    renderTreeV82();
  }
  window.renderCashierBuyerTreeV82 = renderTreeV82;
  window.selectCashierBuyerTreeV82 = selectBuyerTreeV82;
  window.pickCashierBuyerDirectV82 = function(id){
    var buyer = buyerByIdTreeV82(id);
    var sel = document.getElementById("cashierCustomer");
    if(!buyer || !sel) return;
    applyBuyerTreeV82(buyer);
    var wrap = document.getElementById("cashierBuyerTreeV82");
    if(wrap) wrap.classList.remove("open");
    renderTreeV82();
  };

  var oldRenderCashierCustomersTreeV82 = typeof window.renderCashierCustomers === "function" ? window.renderCashierCustomers : null;
  window.renderCashierCustomers = function(){
    if(oldRenderCashierCustomersTreeV82) oldRenderCashierCustomersTreeV82.apply(this, arguments);
    renderTreeV82();
  };

  var oldHandleCustomerTreeV82 = typeof window.handleCustomerOrPayChange === "function" ? window.handleCustomerOrPayChange : null;
  window.handleCustomerOrPayChange = function(){
    if(oldHandleCustomerTreeV82) oldHandleCustomerTreeV82.apply(this, arguments);
    setTimeout(renderTreeV82, 0);
  };

  document.addEventListener("click", function(ev){
    var direct = ev.target && ev.target.closest ? ev.target.closest("[data-buyer-tree-direct-v82]") : null;
    if(direct){
      ev.preventDefault();
      ev.stopPropagation();
      if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      var sel = document.getElementById("cashierCustomer");
      var buyerDirect = buyerByIdTreeV82(direct.getAttribute("data-buyer-tree-direct-v82"));
      if(sel && buyerDirect) applyBuyerTreeV82(buyerDirect);
      var wrapDirect = document.getElementById("cashierBuyerTreeV82");
      if(wrapDirect) wrapDirect.classList.remove("open");
      renderTreeV82();
      return false;
    }
    var row = ev.target && ev.target.closest ? ev.target.closest("[data-buyer-tree-v82]") : null;
    if(row){
      ev.preventDefault();
      ev.stopPropagation();
      if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      selectBuyerTreeV82(row.getAttribute("data-buyer-tree-v82"));
      return false;
    }
    var wrap = document.getElementById("cashierBuyerTreeV82");
    if(wrap && !wrap.contains(ev.target)) wrap.classList.remove("open");
  }, true);

  setTimeout(function(){
    buyersTreeV82().forEach(function(c){
      if(c && typeof c.parentId === "undefined") c.parentId = "";
      if(c && typeof c.disabled === "undefined") c.disabled = false;
    });
    renderTreeV82();
  }, 0);
})();

/* extracted script block 54 */
/* ===== V83：收银码单/售卖同步库存件数和斤数 ===== */
(function(){
  var LOCK = "_stockLockV83";

  function nStockV83(v){ return Number(v || 0) || 0; }
  function rowsStockV83(){ return (typeof batches !== "undefined" && Array.isArray(batches)) ? batches : []; }
  function currentRowsStockV83(){ return (typeof currentCodeBillItems !== "undefined" && Array.isArray(currentCodeBillItems)) ? currentCodeBillItems : []; }
  function savedRowsStockV83(){ return (typeof savedCodeBills !== "undefined" && Array.isArray(savedCodeBills)) ? savedCodeBills : []; }
  function batchNoStockV83(b){ return String((b && (b.no || b.batchNo)) || ""); }
  function itemNameStockV83(item){ return String((item && (item.name || item.goodsName || item.productName)) || ""); }
  function lineNameStockV83(line){ return String((line && (line.name || line.goodsName || line.productName)) || ""); }
  function lineBatchNoStockV83(line){ return String((line && (line.batchNo || line.no)) || ""); }
  function lineOwnerStockV83(line){ return String((line && (line.owner || line.batchOwner || line.ownerName)) || ""); }
  function linePackStockV83(line){ return String((line && (line.pack || line.type)) || ""); }
  function isFinalBillStockV83(bill){
    var st = String((bill && (bill.status || bill.displayStatus)) || "");
    return !!(bill && (bill.orderNo || st === "已下单" || st === "已收银" || st === "已赊欠" || st === "已结清" || st === "已作废"));
  }
  function lineQtyWeightStockV83(line){
    var qty = nStockV83(line && line.qty);
    var weight = nStockV83(line && line.weight);
    if(!weight && linePackStockV83(line) === "定装"){
      weight = qty * nStockV83(line && line.spec);
    }
    return {qty:qty, weight:weight};
  }
  function findBatchByLineStockV83(line){
    if(!line) return null;
    if(line.batchId){
      var byId = rowsStockV83().find(function(b){ return b && b.id === line.batchId; });
      if(byId) return byId;
    }
    var owner = lineOwnerStockV83(line);
    var no = lineBatchNoStockV83(line);
    if(owner || no){
      var byMeta = rowsStockV83().find(function(b){
        return (!owner || String(b.owner || b.ownerName || "") === owner) && (!no || batchNoStockV83(b) === no);
      });
      if(byMeta) return byMeta;
    }
    return null;
  }
  function findItemInBatchStockV83(batch, line){
    if(!batch || !line) return null;
    var items = Array.isArray(batch.items) ? batch.items : [];
    return items.find(function(item){
      return (line.batchItemId && String(item.id || "") === String(line.batchItemId)) ||
        (line.goodsId && String(item.goodsId || "") === String(line.goodsId)) ||
        (line.itemId && String(item.id || "") === String(line.itemId)) ||
        (lineNameStockV83(line) && itemNameStockV83(item) === lineNameStockV83(line));
    }) || null;
  }
  function findItemByLockStockV83(lock){
    if(!lock) return null;
    var batch = lock.batchId ? rowsStockV83().find(function(b){ return b && b.id === lock.batchId; }) : null;
    if(!batch && (lock.owner || lock.batchNo)){
      batch = rowsStockV83().find(function(b){
        return (!lock.owner || String(b.owner || b.ownerName || "") === String(lock.owner)) &&
          (!lock.batchNo || batchNoStockV83(b) === String(lock.batchNo));
      }) || null;
    }
    if(!batch) return null;
    return findItemInBatchStockV83(batch, lock) || null;
  }
  function findItemForLineStockV83(line){
    var batch = findBatchByLineStockV83(line);
    var item = findItemInBatchStockV83(batch, line);
    if(item) return {batch:batch, item:item};
    for(var bi=0; bi<rowsStockV83().length; bi++){
      var b = rowsStockV83()[bi];
      item = findItemInBatchStockV83(b, line);
      if(item) return {batch:b, item:item};
    }
    return {batch:null, item:null};
  }
  function adjustItemStockV83(item, qtyDelta, weightDelta){
    if(!item) return;
    item.sold = Math.max(0, nStockV83(item.sold) + qtyDelta);
    item.soldWeight = Math.max(0, nStockV83(item.soldWeight) + weightDelta);
  }
  function releaseLineStockV83(line){
    if(!line || !line[LOCK]) return;
    if(line[LOCK].final){
      delete line[LOCK];
      return;
    }
    var item = findItemByLockStockV83(line[LOCK]);
    adjustItemStockV83(item, -nStockV83(line[LOCK].qty), -nStockV83(line[LOCK].weight));
    delete line[LOCK];
  }
  function reserveLineStockV83(line, finalLock){
    if(!line) return;
    if(finalLock && line[LOCK] && line[LOCK].final) return;
    releaseLineStockV83(line);
    var amount = lineQtyWeightStockV83(line);
    if(amount.qty <= 0 && amount.weight <= 0) return;
    var found = findItemForLineStockV83(line);
    if(!found.item) return;
    adjustItemStockV83(found.item, amount.qty, amount.weight);
    line.batchId = line.batchId || (found.batch && found.batch.id) || "";
    line.batchItemId = line.batchItemId || found.item.id || found.item.goodsId || "";
    line.goodsId = line.goodsId || found.item.goodsId || "";
    line.owner = line.owner || (found.batch && (found.batch.owner || found.batch.ownerName)) || "";
    line.batchNo = line.batchNo || (found.batch && batchNoStockV83(found.batch)) || "";
    line[LOCK] = {
      batchId:line.batchId,
      batchItemId:line.batchItemId,
      goodsId:line.goodsId,
      name:lineNameStockV83(line),
      owner:lineOwnerStockV83(line),
      batchNo:lineBatchNoStockV83(line),
      qty:amount.qty,
      weight:amount.weight,
      final:!!finalLock
    };
  }
  function cloneLineStockV83(line){
    var copy = Object.assign({}, line || {});
    if(line && line[LOCK]) copy[LOCK] = Object.assign({}, line[LOCK]);
    return copy;
  }
  function hydrateLineStockV83(dest, source){
    if(!dest || !source) return;
    ["goodsId","batchId","batchItemId","owner","batchNo","pack","spec","unit"].forEach(function(k){
      if(source[k] !== undefined && source[k] !== "") dest[k] = source[k];
    });
    if(source[LOCK]) dest[LOCK] = Object.assign({}, source[LOCK]);
  }
  function releaseLinesStockV83(lines){
    (Array.isArray(lines) ? lines : []).forEach(releaseLineStockV83);
  }
  function reserveLinesStockV83(lines, finalLock){
    (Array.isArray(lines) ? lines : []).forEach(function(line){ reserveLineStockV83(line, finalLock); });
  }
  function markFinalLocksStockV83(lines){
    (Array.isArray(lines) ? lines : []).forEach(function(line){
      if(line && line[LOCK]) line[LOCK].final = true;
    });
  }
  function snapshotSoldStockV83(){
    var rows = [];
    rowsStockV83().forEach(function(batch){
      (batch.items || []).forEach(function(item){
        rows.push({item:item, sold:nStockV83(item.sold), soldWeight:nStockV83(item.soldWeight)});
      });
    });
    return rows;
  }
  function restoreSoldStockV83(snapshot){
    (snapshot || []).forEach(function(row){
      row.item.sold = row.sold;
      row.item.soldWeight = row.soldWeight;
    });
  }
  function attachSelectedBatchStockV83(goodsId, selectedBatchId){
    if(!selectedBatchId) return;
    var batch = rowsStockV83().find(function(b){ return b && b.id === selectedBatchId; });
    if(!batch) return;
    var item = (batch.items || []).find(function(i){ return i && String(i.goodsId || "") === String(goodsId || ""); });
    if(!item) return;
    var line = currentRowsStockV83().find(function(i){
      return i && String(i.goodsId || "") === String(goodsId || "") &&
        (String(i.batchId || "") === String(selectedBatchId) || (!i.batchId && (!i.batchNo || i.batchNo === batchNoStockV83(batch))));
    }) || currentRowsStockV83().find(function(i){ return i && String(i.goodsId || "") === String(goodsId || ""); });
    if(!line) return;
    line.batchId = batch.id;
    line.batchItemId = item.id || item.goodsId || "";
    line.owner = batch.owner || batch.ownerName || line.owner || "";
    line.batchNo = batchNoStockV83(batch) || line.batchNo || "";
    line.goodsId = item.goodsId || line.goodsId || goodsId;
    line.spec = line.spec || item.spec || "";
    line.pack = line.pack || item.pack || "";
  }
  function refreshStockViewsV83(){
    try{ if(typeof renderCashierProducts === "function") renderCashierProducts(); }catch(err){}
    try{ if(typeof renderCashierBatches === "function") renderCashierBatches(); }catch(err){}
    try{ if(typeof renderStockModule === "function") renderStockModule(); }catch(err){}
    try{ if(typeof renderInventoryStep1 === "function") renderInventoryStep1(); }catch(err){}
    try{ if(typeof renderInventoryView === "function") renderInventoryView(); }catch(err){}
    try{ if(typeof renderOwnerStep1 === "function") renderOwnerStep1(); }catch(err){}
    try{ if(typeof renderReportsStep1 === "function") renderReportsStep1(); }catch(err){}
  }
  function saveStockV83(){
    try{ if(typeof tudou2SaveNow === "function") setTimeout(tudou2SaveNow, 0); }catch(err){}
  }
  function syncPendingSavedBillsStockV83(){
    savedRowsStockV83().forEach(function(bill){
      if(!bill || isFinalBillStockV83(bill)) return;
      (bill.lines || []).forEach(function(line){ if(!line[LOCK]) reserveLineStockV83(line, false); });
    });
  }
  function syncCurrentStockV83(){
    reserveLinesStockV83(currentRowsStockV83(), false);
  }
  function afterMutationStockV83(){
    syncPendingSavedBillsStockV83();
    syncCurrentStockV83();
    refreshStockViewsV83();
    saveStockV83();
  }

  var oldAddProductStockV83 = typeof window.addProductToCodeBill === "function" ? window.addProductToCodeBill : null;
  if(oldAddProductStockV83 && !oldAddProductStockV83.__stockSyncV83){
    window.addProductToCodeBill = function(goodsId, selectedBatchId){
      releaseLinesStockV83(currentRowsStockV83());
      var result = oldAddProductStockV83.apply(this, arguments);
      attachSelectedBatchStockV83(goodsId, selectedBatchId);
      reserveLinesStockV83(currentRowsStockV83(), false);
      refreshStockViewsV83();
      saveStockV83();
      return result;
    };
    window.addProductToCodeBill.__stockSyncV83 = true;
  }

  var oldUpdateStockV83 = typeof window.updateCodeBillItem === "function" ? window.updateCodeBillItem : null;
  if(oldUpdateStockV83 && !oldUpdateStockV83.__stockSyncV83){
    window.updateCodeBillItem = function(){
      releaseLinesStockV83(currentRowsStockV83());
      var result = oldUpdateStockV83.apply(this, arguments);
      reserveLinesStockV83(currentRowsStockV83(), false);
      refreshStockViewsV83();
      saveStockV83();
      return result;
    };
    window.updateCodeBillItem.__stockSyncV83 = true;
  }

  var oldRemoveStockV83 = typeof window.removeCodeBillItem === "function" ? window.removeCodeBillItem : null;
  if(oldRemoveStockV83 && !oldRemoveStockV83.__stockSyncV83){
    window.removeCodeBillItem = function(){
      releaseLinesStockV83(currentRowsStockV83());
      var result = oldRemoveStockV83.apply(this, arguments);
      reserveLinesStockV83(currentRowsStockV83(), false);
      refreshStockViewsV83();
      saveStockV83();
      return result;
    };
    window.removeCodeBillItem.__stockSyncV83 = true;
  }

  var oldOpenCodeBillStockV83 = typeof window.openCodeBillModal === "function" ? window.openCodeBillModal : null;
  if(oldOpenCodeBillStockV83 && !oldOpenCodeBillStockV83.__stockSyncV83){
    window.openCodeBillModal = function(){
      reserveLinesStockV83(currentRowsStockV83(), false);
      var before = currentRowsStockV83().map(cloneLineStockV83);
      var result = oldOpenCodeBillStockV83.apply(this, arguments);
      var bill = savedRowsStockV83().find(function(b){ return b && b.billNo === selectedBillCenterId; }) || savedRowsStockV83()[0];
      if(bill && !isFinalBillStockV83(bill)){
        (bill.lines || []).forEach(function(line, idx){ hydrateLineStockV83(line, before[idx]); });
      }
      refreshStockViewsV83();
      saveStockV83();
      return result;
    };
    window.openCodeBillModal.__stockSyncV83 = true;
  }

  var oldTakeBillStockV83 = typeof window.takeSavedBill === "function" ? window.takeSavedBill : null;
  if(oldTakeBillStockV83 && !oldTakeBillStockV83.__stockSyncV83){
    window.takeSavedBill = function(billNo){
      var bill = savedRowsStockV83().find(function(b){ return b && b.billNo === billNo; });
      var locks = bill && !isFinalBillStockV83(bill) ? (bill.lines || []).map(cloneLineStockV83) : [];
      var result = oldTakeBillStockV83.apply(this, arguments);
      currentRowsStockV83().forEach(function(line, idx){ hydrateLineStockV83(line, locks[idx]); });
      refreshStockViewsV83();
      saveStockV83();
      return result;
    };
    window.takeSavedBill.__stockSyncV83 = true;
  }

  var oldDeleteBillStockV83 = typeof window.deleteSavedBill === "function" ? window.deleteSavedBill : null;
  if(oldDeleteBillStockV83 && !oldDeleteBillStockV83.__stockSyncV83){
    window.deleteSavedBill = function(billNo){
      var bill = savedRowsStockV83().find(function(b){ return b && b.billNo === billNo; });
      if(bill && !isFinalBillStockV83(bill)) releaseLinesStockV83(bill.lines || []);
      var result = oldDeleteBillStockV83.apply(this, arguments);
      refreshStockViewsV83();
      saveStockV83();
      return result;
    };
    window.deleteSavedBill.__stockSyncV83 = true;
  }

  var oldConfirmOrderStockV83 = typeof window.confirmOrderFromCodeBill === "function" ? window.confirmOrderFromCodeBill : null;
  if(oldConfirmOrderStockV83 && !oldConfirmOrderStockV83.__stockSyncV83){
    window.confirmOrderFromCodeBill = function(){
      var beforeLines = currentRowsStockV83().map(cloneLineStockV83);
      releaseLinesStockV83(currentRowsStockV83());
      var baseline = snapshotSoldStockV83();
      var result = oldConfirmOrderStockV83.apply(this, arguments);
      restoreSoldStockV83(baseline);
      var order = (typeof finalOrders !== "undefined" && Array.isArray(finalOrders)) ? finalOrders[0] : null;
      if(order && order.lines){
        order.lines.forEach(function(line, idx){
          hydrateLineStockV83(line, beforeLines[idx]);
          delete line[LOCK];
          reserveLineStockV83(line, true);
          if(line[LOCK]) line[LOCK].final = true;
        });
      }else{
        beforeLines.forEach(function(line){ delete line[LOCK]; reserveLineStockV83(line, true); if(line[LOCK]) line[LOCK].final = true; });
      }
      refreshStockViewsV83();
      saveStockV83();
      return result;
    };
    window.confirmOrderFromCodeBill.__stockSyncV83 = true;
  }

  var oldCompleteSettleStockV83 = typeof window.completeSettleOrder === "function" ? window.completeSettleOrder : null;
  if(oldCompleteSettleStockV83 && !oldCompleteSettleStockV83.__stockSyncV83){
    window.completeSettleOrder = function(){
      var bill = savedRowsStockV83().find(function(b){ return b && b.billNo === pendingSettleBillNo; });
      var beforeLines = bill ? (bill.lines || []).map(cloneLineStockV83) : [];
      var hadLocks = beforeLines.some(function(line){ return !!line[LOCK]; });
      var result = oldCompleteSettleStockV83.apply(this, arguments);
      var order = (typeof finalOrders !== "undefined" && Array.isArray(finalOrders)) ? finalOrders[0] : null;
      if(order && order.lines){
        order.lines.forEach(function(line, idx){ hydrateLineStockV83(line, beforeLines[idx]); });
        if(hadLocks) markFinalLocksStockV83(order.lines);
        else order.lines.forEach(function(line){ delete line[LOCK]; reserveLineStockV83(line, true); if(line[LOCK]) line[LOCK].final = true; });
      }
      refreshStockViewsV83();
      saveStockV83();
      return result;
    };
    window.completeSettleOrder.__stockSyncV83 = true;
  }

  setTimeout(function(){
    syncPendingSavedBillsStockV83();
    syncCurrentStockV83();
    refreshStockViewsV83();
  }, 0);

  window.syncCashierStockV83 = afterMutationStockV83;
})();

/* extracted script block 55 */
/* ===== V84：库存只在下单后同步，码单草稿不预占 ===== */
(function(){
  var LOCK = "_stockLockV83";

  function nStockV84(v){ return Number(v || 0) || 0; }
  function batchesStockV84(){ return (typeof batches !== "undefined" && Array.isArray(batches)) ? batches : []; }
  function currentStockV84(){ return (typeof currentCodeBillItems !== "undefined" && Array.isArray(currentCodeBillItems)) ? currentCodeBillItems : []; }
  function savedStockV84(){ return (typeof savedCodeBills !== "undefined" && Array.isArray(savedCodeBills)) ? savedCodeBills : []; }
  function batchNoStockV84(b){ return String((b && (b.no || b.batchNo)) || ""); }
  function nameStockV84(row){ return String((row && (row.name || row.goodsName || row.productName)) || ""); }
  function isFinalBillStockV84(bill){
    var st = String((bill && (bill.status || bill.displayStatus)) || "");
    return !!(bill && (bill.orderNo || st === "已下单" || st === "已收银" || st === "已赊欠" || st === "已结清" || st === "已作废"));
  }
  function findItemByLockStockV84(lock){
    if(!lock) return null;
    var batch = lock.batchId ? batchesStockV84().find(function(b){ return b && b.id === lock.batchId; }) : null;
    if(!batch && (lock.owner || lock.batchNo)){
      batch = batchesStockV84().find(function(b){
        return (!lock.owner || String(b.owner || b.ownerName || "") === String(lock.owner)) &&
          (!lock.batchNo || batchNoStockV84(b) === String(lock.batchNo));
      }) || null;
    }
    if(!batch) return null;
    return (batch.items || []).find(function(item){
      return (lock.batchItemId && String(item.id || "") === String(lock.batchItemId)) ||
        (lock.goodsId && String(item.goodsId || "") === String(lock.goodsId)) ||
        (lock.name && nameStockV84(item) === String(lock.name));
    }) || null;
  }
  function releaseDraftLineStockV84(line){
    if(!line || !line[LOCK]) return;
    if(line[LOCK].final){
      delete line[LOCK];
      return;
    }
    var item = findItemByLockStockV84(line[LOCK]);
    if(item){
      item.sold = Math.max(0, nStockV84(item.sold) - nStockV84(line[LOCK].qty));
      item.soldWeight = Math.max(0, nStockV84(item.soldWeight) - nStockV84(line[LOCK].weight));
    }
    delete line[LOCK];
  }
  function releaseDraftLocksStockV84(){
    currentStockV84().forEach(releaseDraftLineStockV84);
    savedStockV84().forEach(function(bill){
      if(!bill || isFinalBillStockV84(bill)) return;
      (bill.lines || []).forEach(releaseDraftLineStockV84);
    });
  }
  function refreshStockV84(){
    try{ if(typeof renderCashierProducts === "function") renderCashierProducts(); }catch(err){}
    try{ if(typeof renderCashierBatches === "function") renderCashierBatches(); }catch(err){}
    try{ if(typeof renderCurrentCodeBill === "function") renderCurrentCodeBill(); }catch(err){}
    try{ if(typeof renderBillCenter === "function") renderBillCenter(); }catch(err){}
    try{ if(typeof renderStockModule === "function") renderStockModule(); }catch(err){}
    try{ if(typeof renderInventoryStep1 === "function") renderInventoryStep1(); }catch(err){}
    try{ if(typeof renderInventoryView === "function") renderInventoryView(); }catch(err){}
  }
  function saveStockV84(){
    try{ if(typeof tudou2SaveNow === "function") setTimeout(tudou2SaveNow, 0); }catch(err){}
  }
  function draftOnlyStockV84(fn){
    return function(){
      releaseDraftLocksStockV84();
      var result = fn.apply(this, arguments);
      releaseDraftLocksStockV84();
      refreshStockV84();
      saveStockV84();
      return result;
    };
  }
  ["addProductToCodeBill","updateCodeBillItem","removeCodeBillItem","openCodeBillModal","takeSavedBill","deleteSavedBill"].forEach(function(name){
    var oldFn = window[name];
    if(typeof oldFn !== "function" || oldFn.__stockAfterOrderOnlyV84) return;
    window[name] = draftOnlyStockV84(oldFn);
    window[name].__stockAfterOrderOnlyV84 = true;
  });

  ["confirmOrderFromCodeBill","completeSettleOrder"].forEach(function(name){
    var oldFn = window[name];
    if(typeof oldFn !== "function" || oldFn.__stockAfterOrderOnlyV84) return;
    window[name] = function(){
      releaseDraftLocksStockV84();
      var result = oldFn.apply(this, arguments);
      refreshStockV84();
      saveStockV84();
      return result;
    };
    window[name].__stockAfterOrderOnlyV84 = true;
  });

  window.releaseDraftStockLocksV84 = function(){
    releaseDraftLocksStockV84();
    refreshStockV84();
    saveStockV84();
  };

  setTimeout(window.releaseDraftStockLocksV84, 0);
})();

/* extracted script block 56 */
/* ===== V85：库存显示按已完成订单 + 已开码单重算，排除正在编辑的草稿 ===== */
(function(){
  var rebuildingStockV85 = false;

  function nStockV85(v){ return Number(v || 0) || 0; }
  function batchesStockV85(){ return (typeof batches !== "undefined" && Array.isArray(batches)) ? batches : []; }
  function ordersStockV85(){ return (typeof finalOrders !== "undefined" && Array.isArray(finalOrders)) ? finalOrders : []; }
  function savedBillsStockV85(){ return (typeof savedCodeBills !== "undefined" && Array.isArray(savedCodeBills)) ? savedCodeBills : []; }
  function batchNoStockV85(b){ return String((b && (b.no || b.batchNo)) || ""); }
  function batchOwnerStockV85(b){ return String((b && (b.owner || b.ownerName)) || ""); }
  function itemNameStockV85(item){ return String((item && (item.name || item.goodsName || item.productName)) || ""); }
  function lineNameStockV85(line){ return String((line && (line.name || line.goodsName || line.productName)) || ""); }
  function lineBatchNoStockV85(line){ return String((line && (line.batchNo || line.no)) || ""); }
  function lineOwnerStockV85(line){ return String((line && (line.owner || line.batchOwner || line.ownerName)) || ""); }
  function linePackStockV85(line){ return String((line && (line.pack || line.type)) || ""); }
  function orderCountsStockV85(order){
    if(!order) return false;
    if(order.voided || order.status === "已作废" || order.displayStatus === "已作废") return false;
    return Array.isArray(order.lines) && order.lines.length;
  }
  function pendingBillCountsStockV85(bill){
    if(!bill) return false;
    if(bill.voided || bill.status === "已作废" || bill.displayStatus === "已作废") return false;
    if(bill.orderNo) return false;
    var st = String(bill.status || bill.displayStatus || "");
    if(st === "已下单" || st === "已收银" || st === "已赊欠" || st === "已结清") return false;
    return Array.isArray(bill.lines) && bill.lines.length;
  }
  function lineQtyWeightStockV85(line, item){
    var qty = nStockV85(line && line.qty);
    var weight = nStockV85(line && line.weight);
    if(!weight && linePackStockV85(line) === "定装"){
      weight = qty * nStockV85((line && line.spec) || (item && item.spec));
    }
    return {qty:qty, weight:weight};
  }
  function batchMatchesLineStockV85(batch, line){
    if(!batch || !line) return false;
    if(line.batchId && String(batch.id || "") === String(line.batchId)) return true;
    var owner = lineOwnerStockV85(line);
    var no = lineBatchNoStockV85(line);
    return (!owner || batchOwnerStockV85(batch) === owner) && (!no || batchNoStockV85(batch) === no);
  }
  function itemMatchesLineStockV85(item, line){
    if(!item || !line) return false;
    return (line.batchItemId && String(item.id || "") === String(line.batchItemId)) ||
      (line.goodsId && String(item.goodsId || "") === String(line.goodsId)) ||
      (line.itemId && String(item.id || "") === String(line.itemId)) ||
      (!!lineNameStockV85(line) && itemNameStockV85(item) === lineNameStockV85(line));
  }
  function findItemForLineStockV85(line){
    if(!line) return null;
    var rows = batchesStockV85();
    for(var bi=0; bi<rows.length; bi++){
      var batch = rows[bi];
      if(!batchMatchesLineStockV85(batch, line)) continue;
      var items = Array.isArray(batch.items) ? batch.items : [];
      for(var ii=0; ii<items.length; ii++){
        if(itemMatchesLineStockV85(items[ii], line)) return items[ii];
      }
    }
    for(var bj=0; bj<rows.length; bj++){
      var looseItems = Array.isArray(rows[bj].items) ? rows[bj].items : [];
      for(var ij=0; ij<looseItems.length; ij++){
        if(itemMatchesLineStockV85(looseItems[ij], line)) return looseItems[ij];
      }
    }
    return null;
  }
  function rebuildSoldFromFinalOrdersV85(){
    if(rebuildingStockV85) return;
    rebuildingStockV85 = true;
    try{
      batchesStockV85().forEach(function(batch){
        (Array.isArray(batch.items) ? batch.items : []).forEach(function(item){
          item.sold = 0;
          item.soldWeight = 0;
        });
      });
      function addLinesStockV85(lines){
        (Array.isArray(lines) ? lines : []).forEach(function(line){
          var item = findItemForLineStockV85(line);
          if(!item) return;
          var amount = lineQtyWeightStockV85(line, item);
          item.sold = nStockV85(item.sold) + amount.qty;
          item.soldWeight = nStockV85(item.soldWeight) + amount.weight;
        });
      }
      ordersStockV85().forEach(function(order){
        if(!orderCountsStockV85(order)) return;
        addLinesStockV85(order.lines);
      });
      savedBillsStockV85().forEach(function(bill){
        if(!pendingBillCountsStockV85(bill)) return;
        addLinesStockV85(bill.lines);
      });
    }finally{
      rebuildingStockV85 = false;
    }
  }
  function refreshStockV85(){
    try{ if(typeof renderCashierProducts === "function") renderCashierProducts(); }catch(err){}
    try{ if(typeof renderCashierBatches === "function") renderCashierBatches(); }catch(err){}
    try{ if(typeof renderCurrentCodeBill === "function") renderCurrentCodeBill(); }catch(err){}
    try{ if(typeof renderBillCenter === "function") renderBillCenter(); }catch(err){}
    try{ if(typeof renderStockModule === "function") renderStockModule(); }catch(err){}
    try{ if(typeof renderInventoryStep1 === "function") renderInventoryStep1(); }catch(err){}
    try{ if(typeof renderInventoryView === "function") renderInventoryView(); }catch(err){}
  }
  function saveStockV85(){
    try{ if(typeof tudou2SaveNow === "function") setTimeout(tudou2SaveNow, 0); }catch(err){}
  }
  function wrapRenderStockV85(name){
    var oldFn = window[name];
    if(typeof oldFn !== "function" || oldFn.__finalOrderStockV85) return;
    window[name] = function(){
      rebuildSoldFromFinalOrdersV85();
      return oldFn.apply(this, arguments);
    };
    window[name].__finalOrderStockV85 = true;
  }
  [
    "renderCashierProducts",
    "renderCashierBatches",
    "renderStockModule",
    "renderInventoryStep1",
    "renderInventoryView",
    "renderGoods",
    "renderDetail",
    "renderReportsStep1",
    "renderOwnerStep1"
  ].forEach(wrapRenderStockV85);

  ["addProductToCodeBill","updateCodeBillItem","removeCodeBillItem","openCodeBillModal","takeSavedBill","deleteSavedBill"].forEach(function(name){
    var oldFn = window[name];
    if(typeof oldFn !== "function" || oldFn.__finalOrderStockDraftV85) return;
    window[name] = function(){
      var result = oldFn.apply(this, arguments);
      rebuildSoldFromFinalOrdersV85();
      refreshStockV85();
      saveStockV85();
      return result;
    };
    window[name].__finalOrderStockDraftV85 = true;
  });

  ["confirmOrderFromCodeBill","completeSettleOrder","saveOrderEditStep1","voidOrderEditStep1"].forEach(function(name){
    var oldFn = window[name];
    if(typeof oldFn !== "function" || oldFn.__finalOrderStockDoneV85) return;
    window[name] = function(){
      var result = oldFn.apply(this, arguments);
      rebuildSoldFromFinalOrdersV85();
      refreshStockV85();
      saveStockV85();
      return result;
    };
    window[name].__finalOrderStockDoneV85 = true;
  });

  window.rebuildSoldFromFinalOrdersV85 = function(){
    rebuildSoldFromFinalOrdersV85();
    refreshStockV85();
    saveStockV85();
  };

  setTimeout(window.rebuildSoldFromFinalOrdersV85, 0);
})();

/* extracted script block 57 */
/* ===== V86：订单完成后强制回到临时客户，避免下一单沿用上个买家 ===== */
(function(){
  function buyersV86(){
    return (typeof cashierCustomers !== "undefined" && Array.isArray(cashierCustomers)) ? cashierCustomers : [];
  }
  function tempBuyerV86(){
    var list = buyersV86();
    var temp = list.find(function(c){ return c && (c.id === "c1" || c.name === "临时客户" || String(c.name || "").startsWith("临时客户")); });
    if(temp) return temp;
    temp = {id:"c1", name:"临时客户", debt:0, payments:[]};
    try{ list.unshift(temp); }catch(err){}
    return temp;
  }
  function orderKeysV86(){
    try{
      return ((typeof finalOrders !== "undefined" && Array.isArray(finalOrders)) ? finalOrders : [])
        .filter(function(o){ return o && !o.voided && o.status !== "已作废" && o.displayStatus !== "已作废"; })
        .map(function(o){ return String(o.orderNo || o.billNo || o.time || ""); })
        .sort()
        .join("|");
    }catch(err){
      return "";
    }
  }
  function resetCashierBuyerToTempV86(){
    var temp = tempBuyerV86();
    try{ currentCodeBillItems = []; }catch(err){}
    try{ selectedBuyerV47Id = temp.id || "c1"; }catch(err){}
    try{
      window.cashierBillSessionsStep1 = [{
        id:"temp_after_order_" + Date.now(),
        customerId:temp.id || "c1",
        name:"临时客户",
        items:[],
        orderRemark:""
      }];
    }catch(err){}
    try{
      if(typeof renderCashierCustomers === "function") renderCashierCustomers();
      var sel = document.getElementById("cashierCustomer");
      if(sel) sel.value = temp.id || "c1";
    }catch(err){}
    try{
      var pay = document.getElementById("cashierPayMode");
      if(pay) pay.value = "cash";
    }catch(err){}
    try{
      var paid = document.getElementById("cashierPaidAmount");
      if(paid) paid.value = "";
      var remark = document.getElementById("cashierOrderRemarkStep1");
      if(remark) remark.value = "";
    }catch(err){}
    try{ if(typeof clearCashierDiscountFields === "function") clearCashierDiscountFields(); }catch(err){}
    try{ if(typeof enforceTemporaryCustomerRule === "function") enforceTemporaryCustomerRule(); }catch(err){}
    try{ if(typeof renderCashierBuyerTreeV82 === "function") renderCashierBuyerTreeV82(); }catch(err){}
    try{ if(typeof renderBuyerV47 === "function") renderBuyerV47(); }catch(err){}
    try{ if(typeof renderCurrentCodeBill === "function") renderCurrentCodeBill(); }catch(err){}
    try{ if(typeof renderCashierCustomerTabsStep1 === "function") renderCashierCustomerTabsStep1(); }catch(err){}
    try{ if(typeof renderCashierProducts === "function") renderCashierProducts(); }catch(err){}
    try{ if(typeof tudou2SaveNow === "function") setTimeout(tudou2SaveNow, 0); }catch(err){}
  }
  window.resetCashierBuyerToTempV86 = resetCashierBuyerToTempV86;

  ["confirmOrderFromCodeBill","completeSettleOrder","checkoutCurrentOrder"].forEach(function(name){
    var oldFn = window[name];
    if(typeof oldFn !== "function" || oldFn.__resetBuyerTempV86) return;
    window[name] = function(){
      var beforeKeys = orderKeysV86();
      var result = oldFn.apply(this, arguments);
      setTimeout(function(){
        if(orderKeysV86() !== beforeKeys) resetCashierBuyerToTempV86();
      }, 80);
      return result;
    };
    window[name].__resetBuyerTempV86 = true;
  });
})();

/* extracted script block 58 */
/* ===== V87：下单必填斤数/单价；有码单未结时禁止停售对应货品 ===== */
(function(){
  function nV87(v){ return Number(v || 0) || 0; }
  function batchesV87(){ return (typeof batches !== "undefined" && Array.isArray(batches)) ? batches : []; }
  function currentLinesV87(){ return (typeof currentCodeBillItems !== "undefined" && Array.isArray(currentCodeBillItems)) ? currentCodeBillItems : []; }
  function savedBillsV87(){ return (typeof savedCodeBills !== "undefined" && Array.isArray(savedCodeBills)) ? savedCodeBills : []; }
  function nameV87(row){ return String((row && (row.name || row.goodsName || row.productName)) || ""); }
  function ownerV87(row){ return String((row && (row.owner || row.ownerName || row.batchOwner)) || ""); }
  function batchNoV87(row){ return String((row && (row.no || row.batchNo)) || ""); }
  function packV87(line){ return String((line && (line.pack || line.type)) || ""); }
  function isFixedV87(line){ return packV87(line) === "定装"; }
  function isFinalOrVoidBillV87(bill){
    var st = String((bill && (bill.status || bill.displayStatus)) || "");
    return !!(bill && (bill.orderNo || bill.voided || st === "已作废" || st === "已下单" || st === "已收银" || st === "已赊欠" || st === "已结清"));
  }
  function pendingBillsV87(){
    return savedBillsV87().filter(function(bill){
      return bill && !isFinalOrVoidBillV87(bill) && Array.isArray(bill.lines) && bill.lines.length;
    });
  }
  function lineLabelV87(line){
    return nameV87(line) || "未命名货品";
  }
  function validateOrderLinesV87(lines){
    var rows = Array.isArray(lines) ? lines : [];
    for(var i=0; i<rows.length; i++){
      var line = rows[i] || {};
      if(nV87(line.qty) <= 0){
        return {ok:false, message:"请先填写 " + lineLabelV87(line) + " 的件数。"};
      }
      if(!isFixedV87(line) && nV87(line.weight) <= 0){
        return {ok:false, message:"请先填写 " + lineLabelV87(line) + " 的斤数。"};
      }
      if(nV87(line.price) <= 0){
        return {ok:false, message:"请先填写 " + lineLabelV87(line) + " 的单价。"};
      }
    }
    return {ok:true, message:""};
  }
  function alertGuardV87(message){
    if(typeof toast === "function") toast(message);
    alert(message);
  }
  function billForSettleV87(){
    try{
      var no = typeof pendingSettleBillNo !== "undefined" ? String(pendingSettleBillNo || "") : "";
      if(!no) return null;
      return savedBillsV87().find(function(bill){ return bill && String(bill.billNo || "") === no; }) || null;
    }catch(err){
      return null;
    }
  }
  function batchByIdV87(batchId){
    return batchesV87().find(function(b){ return b && String(b.id || "") === String(batchId || ""); }) || null;
  }
  function activeBatchV87(){
    try{ return typeof activeBatch === "function" ? activeBatch() : null; }catch(err){ return null; }
  }
  function itemByIdV87(batch, itemId){
    if(!batch) return null;
    return (batch.items || []).find(function(item){ return item && String(item.id || item.goodsId || nameV87(item)) === String(itemId || ""); }) || null;
  }
  function itemByGoodsV87(batch, goodsId, goodsName){
    if(!batch) return null;
    return (batch.items || []).find(function(item){
      return item && (
        String(item.goodsId || "") === String(goodsId || "") ||
        String(item.id || "") === String(goodsId || "") ||
        (!!goodsName && nameV87(item) === String(goodsName))
      );
    }) || null;
  }
  function batchMatchesLineV87(batch, line){
    if(!batch || !line) return false;
    if(line.batchId && String(batch.id || "") === String(line.batchId)) return true;
    var lineOwner = ownerV87(line);
    var lineNo = batchNoV87(line);
    return (!lineOwner || ownerV87(batch) === lineOwner) && (!lineNo || batchNoV87(batch) === lineNo);
  }
  function itemMatchesLineV87(item, line){
    if(!item || !line) return false;
    return (line.batchItemId && String(item.id || "") === String(line.batchItemId)) ||
      (line.goodsId && String(item.goodsId || "") === String(line.goodsId)) ||
      (line.itemId && String(item.id || "") === String(line.itemId)) ||
      (!!nameV87(line) && nameV87(item) === nameV87(line));
  }
  function pendingLineForItemV87(batch, item){
    if(!batch || !item) return null;
    for(var bi=0; bi<pendingBillsV87().length; bi++){
      var bill = pendingBillsV87()[bi];
      for(var li=0; li<(bill.lines || []).length; li++){
        var line = bill.lines[li];
        if(batchMatchesLineV87(batch, line) && itemMatchesLineV87(item, line)){
          return {bill:bill, line:line};
        }
      }
    }
    return null;
  }
  function pendingLineForBatchV87(batch){
    if(!batch) return null;
    var items = Array.isArray(batch.items) ? batch.items : [];
    for(var i=0; i<items.length; i++){
      var hit = pendingLineForItemV87(batch, items[i]);
      if(hit) return hit;
    }
    return null;
  }
  function stopBlockedMessageV87(hit){
    var billNo = hit && hit.bill && hit.bill.billNo ? "（码单 " + hit.bill.billNo + "）" : "";
    return lineLabelV87(hit && hit.line) + " 还在码单中心未下单收银" + billNo + "，不能停售。请先完成收银、下单或处理该码单。";
  }
  function wrapOrderGuardV87(name, getLines){
    var oldFn = window[name];
    if(typeof oldFn !== "function" || oldFn.__requiredFieldsV87) return;
    window[name] = function(){
      var lines = getLines ? getLines() : [];
      if(lines && lines.length){
        var check = validateOrderLinesV87(lines);
        if(!check.ok){
          alertGuardV87(check.message);
          return;
        }
      }
      return oldFn.apply(this, arguments);
    };
    window[name].__requiredFieldsV87 = true;
  }
  wrapOrderGuardV87("openCodeBillModal", function(){ return currentLinesV87(); });
  wrapOrderGuardV87("saveCodeBill", function(){ return currentLinesV87(); });
  wrapOrderGuardV87("confirmOrderFromCodeBill", function(){ return currentLinesV87(); });
  wrapOrderGuardV87("completeSettleOrder", function(){
    var bill = billForSettleV87();
    return bill && bill.lines ? bill.lines : [];
  });

  var oldToggleBatchDetailSaleV87 = window.toggleBatchDetailItemSaleStep1;
  if(typeof oldToggleBatchDetailSaleV87 === "function" && !oldToggleBatchDetailSaleV87.__pendingStopGuardV87){
    window.toggleBatchDetailItemSaleStep1 = function(itemId){
      var batch = activeBatchV87();
      var item = itemByIdV87(batch, itemId);
      var alreadyStopped = typeof batchDetailItemStoppedStep1 === "function" ? batchDetailItemStoppedStep1(item) : !!(item && item.saleStopped);
      var hit = !alreadyStopped ? pendingLineForItemV87(batch, item) : null;
      if(hit){
        alertGuardV87(stopBlockedMessageV87(hit));
        return;
      }
      return oldToggleBatchDetailSaleV87.apply(this, arguments);
    };
    window.toggleBatchDetailItemSaleStep1.__pendingStopGuardV87 = true;
  }

  var oldStockToggleItemSaleV87 = window.stockToggleItemSaleStep1;
  if(typeof oldStockToggleItemSaleV87 === "function" && !oldStockToggleItemSaleV87.__pendingStopGuardV87){
    window.stockToggleItemSaleStep1 = function(batchId, goodsId){
      var batch = batchByIdV87(batchId);
      var item = itemByGoodsV87(batch, goodsId, "");
      var batchStopped = typeof stockBatchStoppedStep1 === "function" ? stockBatchStoppedStep1(batch) : !!(batch && batch.saleStopped);
      var itemStopped = !!(item && (item.saleStopped || item.saleStatus === "stopped" || item.salePaused));
      var hit = (!batchStopped && !itemStopped) ? pendingLineForItemV87(batch, item) : null;
      if(hit){
        alertGuardV87(stopBlockedMessageV87(hit));
        return;
      }
      return oldStockToggleItemSaleV87.apply(this, arguments);
    };
    window.stockToggleItemSaleStep1.__pendingStopGuardV87 = true;
  }

  var oldInventoryGoodsSaleV87 = window.toggleInventoryGoodsSaleStep1;
  if(typeof oldInventoryGoodsSaleV87 === "function" && !oldInventoryGoodsSaleV87.__pendingStopGuardV87){
    window.toggleInventoryGoodsSaleStep1 = function(batchId, goodsId, goodsName){
      var batch = batchByIdV87(batchId);
      var item = itemByGoodsV87(batch, goodsId, goodsName);
      var itemStopped = typeof itemSaleStoppedStep1 === "function" ? itemSaleStoppedStep1(item) : !!(item && item.saleStopped);
      var hit = !itemStopped ? pendingLineForItemV87(batch, item) : null;
      if(hit){
        alertGuardV87(stopBlockedMessageV87(hit));
        return;
      }
      return oldInventoryGoodsSaleV87.apply(this, arguments);
    };
    window.toggleInventoryGoodsSaleStep1.__pendingStopGuardV87 = true;
  }

  ["toggleInventoryBatchSaleStep1","markInventoryBatchSoldOutStep1"].forEach(function(name){
    var oldFn = window[name];
    if(typeof oldFn !== "function" || oldFn.__pendingStopGuardV87) return;
    window[name] = function(batchId){
      var batch = batchByIdV87(batchId);
      var stopped = !!(batch && (batch.saleStopped || batch.soldOut || batch.saleStatus === "stopped" || batch.saleStatus === "soldout"));
      var hit = !stopped ? pendingLineForBatchV87(batch) : null;
      if(hit){
        alertGuardV87(stopBlockedMessageV87(hit));
        return;
      }
      return oldFn.apply(this, arguments);
    };
    window[name].__pendingStopGuardV87 = true;
  });

  window.validateCashierOrderLinesV87 = validateOrderLinesV87;
  window.pendingCodeBillLineForItemV87 = pendingLineForItemV87;
})();

/* extracted script block 59 */
/* ===== V88：库存页与收银台统一按完成订单 + 未完成码单占用计算 ===== */
(function(){
  var oldStockCalcItemV88 = typeof window.stockCalcItem === "function" ? window.stockCalcItem : null;
  var oldRenderStockV88 = typeof window.renderStockModule === "function" ? window.renderStockModule : null;
  var oldRenderInventoryV88 = typeof window.renderInventoryStep1 === "function" ? window.renderInventoryStep1 : null;
  var usageCacheV88 = null;
  window.inventoryStep1FilterV88 = window.inventoryStep1FilterV88 || {type:"all", value:"all", title:"全部批次"};

  function nV88(v){ return Number(v || 0) || 0; }
  function eV88(v){ return typeof esc === "function" ? esc(v) : String(v ?? ""); }
  function qV88(v){ return String(v ?? "").replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\r?\n/g, " "); }
  function mV88(v){ return typeof money === "function" ? money(v) : nV88(v).toFixed(2); }
  function rowsV88(){ return (typeof batches !== "undefined" && Array.isArray(batches)) ? batches : []; }
  function ordersV88(){ return (typeof finalOrders !== "undefined" && Array.isArray(finalOrders)) ? finalOrders : []; }
  function billsV88(){ return (typeof savedCodeBills !== "undefined" && Array.isArray(savedCodeBills)) ? savedCodeBills : []; }
  function goodsV88(){ return (typeof goodsMaster !== "undefined" && Array.isArray(goodsMaster)) ? goodsMaster : []; }
  function batchNoV88(batch){ return String((batch && (batch.no || batch.batchNo)) || ""); }
  function batchOwnerV88(batch){ return String((batch && (batch.owner || batch.ownerName)) || ""); }
  function lineBatchNoV88(line){ return String((line && (line.batchNo || line.no)) || ""); }
  function lineOwnerV88(line){ return String((line && (line.owner || line.batchOwner || line.ownerName)) || ""); }
  function lineNameV88(line){ return String((line && (line.name || line.goodsName || line.productName)) || ""); }
  function itemGoodsV88(item){ return goodsV88().find(function(g){ return item && g && g.id === item.goodsId; }) || {}; }
  function itemNameV88(item){
    var g = itemGoodsV88(item);
    return String((item && (item.name || item.goodsName || item.productName)) || g.name || "未命名商品");
  }
  function itemPackV88(item){
    var g = itemGoodsV88(item);
    return String((item && item.pack) || g.pack || "");
  }
  function itemSpecV88(item){
    var g = itemGoodsV88(item);
    return nV88((item && item.spec) || g.spec);
  }
  function itemUnitV88(item){
    var g = itemGoodsV88(item);
    return String((item && item.unit) || g.unit || "件");
  }
  function isConfirmedBatchV88(batch){
    return !!(batch && batch.confirmed) && !(batch.ownerSettled || batch.ownerSettlementAt || batch.saleStatus === "settled");
  }
  function confirmedBatchesV88(){
    try{ if(typeof ensureBatchConfirmFlags === "function") ensureBatchConfirmFlags(); }catch(err){}
    return rowsV88().filter(isConfirmedBatchV88);
  }
  function completedOrderV88(order){
    if(!order || order.voided || order.status === "已作废" || order.displayStatus === "已作废") return false;
    if(typeof normalizeOrderType === "function"){
      var t = normalizeOrderType(order);
      return t === "已收银" || t === "已赊欠";
    }
    return !!(order.orderNo || order.status === "已下单" || order.status === "已收银" || order.status === "已赊欠");
  }
  function pendingBillV88(bill){
    if(!bill || bill.voided || bill.status === "已作废" || bill.displayStatus === "已作废") return false;
    if(bill.orderNo) return false;
    var st = String(bill.status || bill.displayStatus || "");
    if(st === "已下单" || st === "已收银" || st === "已赊欠" || st === "已结清") return false;
    return Array.isArray(bill.lines) && bill.lines.length;
  }
  function batchMatchesLineV88(batch, line){
    if(!batch || !line) return false;
    if(line.batchId && String(batch.id || "") === String(line.batchId)) return true;
    var owner = lineOwnerV88(line);
    var no = lineBatchNoV88(line);
    return (!owner || batchOwnerV88(batch) === owner) && (!no || batchNoV88(batch) === no);
  }
  function itemMatchesLineV88(item, line){
    if(!item || !line) return false;
    return (line.batchItemId && String(item.id || "") === String(line.batchItemId)) ||
      (line.goodsId && String(item.goodsId || "") === String(line.goodsId)) ||
      (line.itemId && String(item.id || "") === String(line.itemId)) ||
      (!!lineNameV88(line) && itemNameV88(item) === lineNameV88(line));
  }
  function findItemForLineV88(line){
    var batches = confirmedBatchesV88();
    for(var bi=0; bi<batches.length; bi++){
      var batch = batches[bi];
      if(!batchMatchesLineV88(batch, line)) continue;
      var items = Array.isArray(batch.items) ? batch.items : [];
      for(var ii=0; ii<items.length; ii++){
        if(itemMatchesLineV88(items[ii], line)) return {batch:batch, item:items[ii]};
      }
    }
    for(var bj=0; bj<batches.length; bj++){
      var loose = Array.isArray(batches[bj].items) ? batches[bj].items : [];
      for(var ij=0; ij<loose.length; ij++){
        if(itemMatchesLineV88(loose[ij], line)) return {batch:batches[bj], item:loose[ij]};
      }
    }
    return {batch:null, item:null};
  }
  function lineQtyWeightV88(line, item){
    var qty = nV88(line && line.qty);
    var weight = nV88(line && line.weight);
    var pack = String((line && (line.pack || line.type)) || itemPackV88(item));
    if(!weight && pack === "定装") weight = qty * nV88((line && line.spec) || itemSpecV88(item));
    return {qty:qty, weight:weight};
  }
  function ensureUsageRowV88(map, item){
    if(!map.has(item)) map.set(item, {soldQty:0, soldWeight:0, pendingQty:0, pendingWeight:0, saleAmount:0, ledger:[]});
    return map.get(item);
  }
  function addUsageLinesV88(map, source, pending){
    (Array.isArray(source && source.lines) ? source.lines : []).forEach(function(line){
      var found = findItemForLineV88(line);
      if(!found.item) return;
      var amount = lineQtyWeightV88(line, found.item);
      var row = ensureUsageRowV88(map, found.item);
      if(pending){
        row.pendingQty += amount.qty;
        row.pendingWeight += amount.weight;
      }else{
        row.soldQty += amount.qty;
        row.soldWeight += amount.weight;
        row.saleAmount += nV88(line.amount);
      }
      row.ledger.push({
        pending:pending,
        time:source.time || "",
        buyer:source.customerName || "",
        orderNo:source.orderNo || source.billNo || "",
        qty:amount.qty,
        weight:amount.weight,
        amount:nV88(line.amount)
      });
    });
  }
  function usageMapV88(){
    if(usageCacheV88) return usageCacheV88;
    var map = new Map();
    ordersV88().forEach(function(order){ if(completedOrderV88(order)) addUsageLinesV88(map, order, false); });
    billsV88().forEach(function(bill){ if(pendingBillV88(bill)) addUsageLinesV88(map, bill, true); });
    return map;
  }
  function findBatchForItemObjectV88(item){
    for(var bi=0; bi<rowsV88().length; bi++){
      var batch = rowsV88()[bi];
      var items = Array.isArray(batch && batch.items) ? batch.items : [];
      for(var ii=0; ii<items.length; ii++){
        if(items[ii] === item) return batch;
      }
    }
    return null;
  }
  function calcItemV88(item){
    var pack = itemPackV88(item);
    var fixed = pack === "定装";
    var qty = nV88(item && item.qty);
    var unit = itemUnitV88(item);
    var spec = itemSpecV88(item);
    var inWeight = fixed ? qty * spec : nV88(item && item.weight);
    var usage = usageMapV88().get(item) || {soldQty:0, soldWeight:0, pendingQty:0, pendingWeight:0, saleAmount:0, ledger:[]};
    var sold = usage.soldQty + usage.pendingQty;
    var soldWeight = usage.soldWeight + usage.pendingWeight;
    if(fixed) soldWeight = sold * spec;
    if(!fixed && qty > 0 && sold >= qty && inWeight > 0 && soldWeight < inWeight) soldWeight = inWeight;
    var remainQty = qty - sold;
    var remainWeight = inWeight - soldWeight;
    return {
      qty:qty,
      sold:sold,
      soldWeight:soldWeight,
      pendingQty:usage.pendingQty,
      pendingWeight:usage.pendingWeight,
      remainQty:remainQty,
      inWeight:inWeight,
      remainWeight:remainWeight,
      unit:unit,
      fixed:fixed,
      saleAmount:usage.saleAmount,
      ledger:usage.ledger
    };
  }
  function amountTextV88(qty, weight, unit, pendingQty, pendingWeight){
    var pending = (nV88(pendingQty) > 0 || nV88(pendingWeight) > 0)
      ? '<span class="inventory-step1-sub">含码单占用 '+nV88(pendingQty)+eV88(unit || "件")+' / '+nV88(pendingWeight)+'斤</span>'
      : "";
    return nV88(qty)+eV88(unit || "件")+'<span class="inventory-step1-sub">'+nV88(weight)+'斤</span>'+pending;
  }
  function batchStoppedV88(batch){
    return !!(batch && (batch.saleStopped || batch.soldOut || batch.saleStatus === "stopped" || batch.saleStatus === "soldout" || batch.salePaused || batch.settled || batch.closed));
  }
  function itemStoppedV88(item){
    return !!(item && (item.saleStopped || item.saleStatus === "stopped" || item.salePaused || item.settled || item.closed));
  }
  function batchSoldOutV88(batch){
    return !!(batch && (batch.soldOut || batch.saleStatus === "soldout"));
  }
  function batchSettledV88(batch){
    return !!(batch && (batch.settled || batch.closed || batch.saleStatus === "settled"));
  }
  function itemSettledV88(item){
    return !!(item && (item.settled || item.closed || item.saleStatus === "settled"));
  }
  function rowsForInventoryV88(){
    var rows = [];
    confirmedBatchesV88().forEach(function(batch){
      (Array.isArray(batch.items) ? batch.items : []).forEach(function(item){
        var calc = calcItemV88(item);
        rows.push({
          owner:batchOwnerV88(batch) || "-",
          batchId:batch.id || "",
          batchNo:batchNoV88(batch) || "-",
          batchType:batch.tag || batch.type || "",
          goodsId:item.goodsId || item.id || itemNameV88(item),
          goodsName:itemNameV88(item),
          pack:itemPackV88(item),
          unit:calc.unit,
          inQty:calc.qty,
          inWeight:calc.inWeight,
          soldQty:calc.sold,
          soldWeight:calc.soldWeight,
          pendingQty:calc.pendingQty,
          pendingWeight:calc.pendingWeight,
          remainQty:calc.remainQty,
          remainWeight:calc.remainWeight,
          saleAmount:calc.saleAmount,
          orders:calc.ledger,
          saleStopped:batchStoppedV88(batch) || itemStoppedV88(item),
          soldOut:batchSoldOutV88(batch),
          settled:batchSettledV88(batch) || itemSettledV88(item)
        });
      });
    });
    return rows;
  }
  function filteredRowsV88(){
    var filter = window.inventoryStep1FilterV88 || {type:"all", value:"all", title:"全部批次"};
    var q = String((document.getElementById("inventoryStep1Search") && document.getElementById("inventoryStep1Search").value) || "").trim().toLowerCase();
    return rowsForInventoryV88().filter(function(r){
      if(filter.type === "owner" && r.owner !== filter.value) return false;
      if(filter.type === "batch" && r.batchId !== filter.value) return false;
      if(filter.type === "goods" && r.goodsId !== filter.value && r.goodsName !== filter.value) return false;
      if(!q) return true;
      return [r.owner,r.batchNo,r.batchType,r.goodsName,r.pack].join(" ").toLowerCase().includes(q);
    });
  }
  function stateTextV88(row){
    if(row.settled || row.soldOut) return "已售完";
    if(row.saleStopped) return "已停售";
    if(row.remainQty < 0 || row.remainWeight < 0) return "超卖";
    if(row.remainQty <= 0 && row.inQty > 0) return "售完";
    if(row.pendingQty > 0 || row.pendingWeight > 0) return "占用中";
    return "开售中";
  }
  function buildTreeV88(allRows){
    var filter = window.inventoryStep1FilterV88 || {type:"all", value:"all", title:"全部批次"};
    var owners = {};
    allRows.forEach(function(row){
      if(!owners[row.owner]) owners[row.owner] = {};
      if(!owners[row.owner][row.batchId]) owners[row.owner][row.batchId] = {batchNo:row.batchNo, type:row.batchType, rows:[]};
      owners[row.owner][row.batchId].rows.push(row);
    });
    var html = '<div class="inventory-step1-node '+(filter.type==="all" ? "active" : "")+'" onclick="inventoryStep1Select(\'all\',\'all\',\'全部批次\')"><b>全部批次</b><span>'+allRows.length+' 个商品明细</span></div>';
    Object.keys(owners).forEach(function(owner){
      var ownerRows = [];
      Object.keys(owners[owner]).forEach(function(batchId){ ownerRows = ownerRows.concat(owners[owner][batchId].rows); });
      html += '<div class="inventory-step1-node '+(filter.type==="owner" && filter.value===owner ? "active" : "")+'" onclick="inventoryStep1Select(\'owner\',\''+qV88(owner)+'\',\''+qV88(owner)+'\')"><b>'+eV88(owner)+'</b><span>'+Object.keys(owners[owner]).length+' 个批次｜'+ownerRows.length+' 个商品</span></div>';
      Object.keys(owners[owner]).forEach(function(batchId){
        var b = owners[owner][batchId];
        var source = rowsV88().find(function(batch){ return batch && String(batch.id || "") === String(batchId || ""); });
        var status = batchSoldOutV88(source) ? "｜已售完" : (batchStoppedV88(source) ? "｜已停售" : "");
        html += '<div class="inventory-step1-node batch '+(filter.type==="batch" && filter.value===batchId ? "active" : "")+'" onclick="inventoryStep1Select(\'batch\',\''+qV88(batchId)+'\',\''+qV88(owner + "｜" + b.batchNo)+'\')"><b>批次 '+eV88(b.batchNo)+'</b><span>'+eV88(b.type)+'｜'+b.rows.length+' 个商品'+status+'</span></div>';
      });
    });
    return html;
  }
  function renderBatchOpsV88(){
    var actions = document.querySelector("#inventoryStep1Root .inventory-step1-actions");
    if(!actions) return;
    actions.querySelectorAll(".inventory-step1-batch-op").forEach(function(el){ el.remove(); });
    var filter = window.inventoryStep1FilterV88 || {};
    if(filter.type !== "batch") return;
    var batch = rowsV88().find(function(b){ return b && String(b.id || "") === String(filter.value || ""); });
    if(!batch) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "inventory-step1-batch-op " + (batchSoldOutV88(batch) ? "inventory-step1-gray" : "inventory-step1-orangebtn");
    btn.textContent = batchSoldOutV88(batch) ? "取消售完" : "售完";
    btn.onclick = function(){ if(typeof markInventoryBatchSoldOutStep1 === "function") markInventoryBatchSoldOutStep1(batch.id); };
    actions.appendChild(btn);
  }
  function ensureInventoryDomV88(){
    if(!document.getElementById("inventoryStep1Root") && typeof oldRenderInventoryV88 === "function"){
      try{ oldRenderInventoryV88(); }catch(err){}
    }
    return !!document.getElementById("inventoryStep1Root");
  }

  window.stockCalcItem = function(item){
    if(!item && oldStockCalcItemV88) return oldStockCalcItemV88.apply(this, arguments);
    return calcItemV88(item);
  };

  if(typeof oldRenderStockV88 === "function" && !oldRenderStockV88.__stockUnifiedV88){
    window.renderStockModule = function(){
      usageCacheV88 = usageMapV88();
      try{
        var result = oldRenderStockV88.apply(this, arguments);
        var soldLabel = document.querySelector("#stockSummarySold")?.parentElement?.querySelector("span");
        if(soldLabel) soldLabel.textContent = "已售/码单占用";
        document.querySelectorAll("#stockRoot .stock-table thead th").forEach(function(th){
          if((th.textContent || "").includes("已售")) th.textContent = "已售/占用量";
        });
        var sub = document.querySelector("#stockRoot .stock-topbar p");
        if(sub) sub.textContent = "只显示已确认入库的商品；已完成订单和码单中心未下单占用会同步到剩余库存。";
        return result;
      }finally{
        usageCacheV88 = null;
      }
    };
    window.renderStockModule.__stockUnifiedV88 = true;
  }

  window.inventoryStep1Select = function(type, value, title){
    window.inventoryStep1FilterV88 = {type:type || "all", value:value || "all", title:title || "全部批次"};
    window.renderInventoryStep1();
  };

  window.renderInventoryStep1 = function(){
    if(!ensureInventoryDomV88()) return;
    usageCacheV88 = usageMapV88();
    try{
      var root = document.getElementById("inventoryStep1Root");
      if(!root) return;
      var allRows = rowsForInventoryV88();
      var showRows = filteredRowsV88();
      var totals = showRows.reduce(function(s,r){
        s.inQty += r.inQty; s.inWeight += r.inWeight;
        s.soldQty += r.soldQty; s.soldWeight += r.soldWeight;
        s.pendingQty += r.pendingQty; s.pendingWeight += r.pendingWeight;
        s.remainQty += r.remainQty; s.remainWeight += r.remainWeight;
        s.amount += r.saleAmount;
        return s;
      }, {inQty:0,inWeight:0,soldQty:0,soldWeight:0,pendingQty:0,pendingWeight:0,remainQty:0,remainWeight:0,amount:0});
      var filter = window.inventoryStep1FilterV88 || {type:"all", value:"all", title:"全部批次"};
      var tree = document.getElementById("inventoryStep1Tree");
      var title = document.getElementById("inventoryStep1Title");
      var sub = document.getElementById("inventoryStep1Sub");
      var summary = document.getElementById("inventoryStep1Summary");
      var table = document.getElementById("inventoryStep1Table");
      var ledger = document.getElementById("inventoryStep1Ledger");
      if(tree) tree.innerHTML = buildTreeV88(allRows);
      if(title) title.textContent = filter.title || "全部批次";
      if(sub) sub.textContent = "库存与收银台同口径：已完成订单 + 码单中心未下单占用，共同影响剩余。";
      renderBatchOpsV88();
      if(summary){
        summary.innerHTML = [
          ["商品明细", showRows.length],
          ["入库数量", nV88(totals.inQty)],
          ["入库重量", nV88(totals.inWeight) + "斤"],
          ["已售/占用数量", nV88(totals.soldQty)],
          ["已售/占用重量", nV88(totals.soldWeight) + "斤"],
          ["码单占用", nV88(totals.pendingQty) + "件 / " + nV88(totals.pendingWeight) + "斤"],
          ["剩余数量", nV88(totals.remainQty)],
          ["剩余重量", nV88(totals.remainWeight) + "斤"],
          ["销售金额", mV88(totals.amount)]
        ].map(function(x){ return '<div class="inventory-step1-card"><span>'+eV88(x[0])+'</span><b>'+eV88(x[1])+'</b></div>'; }).join("");
      }
      if(table){
        table.innerHTML = showRows.length ? '<table class="inventory-step1-table"><thead><tr><th>货主</th><th>批次</th><th>商品</th><th>入库数量/重量</th><th>已售/占用数量</th><th>剩余库存</th><th>销售金额</th><th>状态</th><th>操作</th></tr></thead><tbody>'+
          showRows.map(function(r){
            var remainCls = r.remainQty < 0 || r.remainWeight < 0 ? "inventory-negative" : "inventory-positive";
            var opText = r.saleStopped ? "开售" : "停售";
            var opClass = r.saleStopped ? "inventory-step1-greenbtn" : "inventory-step1-orangebtn";
            return '<tr onclick="inventoryStep1Select(\'goods\',\''+qV88(r.goodsId)+'\',\''+qV88(r.goodsName)+'\')"><td>'+eV88(r.owner)+'</td><td><b>'+eV88(r.batchNo)+'</b><span>'+eV88(r.batchType)+'</span></td><td><b class="inventory-step1-green">'+eV88(r.goodsName)+'</b><span>'+eV88(r.pack)+'</span></td><td>'+amountTextV88(r.inQty,r.inWeight,r.unit)+'</td><td>'+amountTextV88(r.soldQty,r.soldWeight,r.unit,r.pendingQty,r.pendingWeight)+'</td><td>'+amountTextV88(r.remainQty,r.remainWeight,r.unit)+'</td><td>'+mV88(r.saleAmount)+'</td><td><em class="'+((r.settled || r.soldOut) ? "settled" : r.saleStopped ? "stopped" : "")+'">'+eV88(stateTextV88(r))+'</em></td><td><button type="button" class="'+opClass+'" onclick="event.stopPropagation();toggleInventoryGoodsSaleStep1(\''+qV88(r.batchId)+'\',\''+qV88(r.goodsId)+'\',\''+qV88(r.goodsName)+'\')">'+opText+'</button></td></tr>';
          }).join("") + '</tbody></table>' : '<div class="inventory-step1-empty">暂无已确认入库库存。<br>新建批次后，必须点击“确认入库”才会进入库存和收银台。</div>';
      }
      if(ledger){
        var orderLines = [];
        showRows.forEach(function(r){
          (r.orders || []).forEach(function(o){
            orderLines.push('<tr><td>'+(o.pending ? "码单占用" : "销售出库")+'</td><td>'+eV88(o.time)+'</td><td>'+eV88(r.owner)+'</td><td>'+eV88(r.batchNo)+'</td><td>'+eV88(r.goodsName)+'</td><td>'+eV88(o.buyer)+'</td><td>'+eV88(o.orderNo)+'</td><td>-'+nV88(o.qty)+eV88(r.unit)+'</td><td>-'+nV88(o.weight)+'斤</td><td>'+mV88(o.amount)+'</td></tr>');
          });
        });
        ledger.innerHTML = '<table class="inventory-step1-table"><thead><tr><th>类型</th><th>时间</th><th>货主</th><th>批次</th><th>商品</th><th>买家</th><th>单号</th><th>数量</th><th>重量</th><th>金额</th></tr></thead><tbody>'+
          (orderLines.join("") || '<tr><td colspan="10">暂无销售出库或码单占用记录。</td></tr>') + '</tbody></table>';
      }
    }finally{
      usageCacheV88 = null;
    }
  };

  setTimeout(function(){
    try{ if(typeof renderStockModule === "function") renderStockModule(); }catch(err){}
    try{ if(typeof renderInventoryStep1 === "function") renderInventoryStep1(); }catch(err){}
  }, 0);
})();

/* extracted script block 60 */
/* ===== V89：订单编辑支持收银/赊欠状态互转，并同步欠款 ===== */
(function(){
  function nV89(v){ return Number(v || 0) || 0; }
  function moneyV89(v){ return typeof money === "function" ? money(v) : nV89(v).toFixed(2); }
  function escV89(v){
    return typeof esc === "function" ? esc(v) : String(v ?? "").replace(/[&<>"']/g, function(m){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m];
    });
  }
  function isTempBuyerV89(buyerId){
    try{
      var rows = (typeof cashierCustomers !== "undefined" && Array.isArray(cashierCustomers)) ? cashierCustomers : [];
      var buyer = rows.find(function(c){ return c && c.id === buyerId; });
      var name = String((buyer && buyer.name) || "");
      return !buyer || buyer.id === "c1" || name === "临时客户" || name.startsWith("临时客户");
    }catch(err){
      return false;
    }
  }
  function currentOrderV89(){
    try{
      var selected = typeof currentSelectedOrderRecord === "function" ? currentSelectedOrderRecord() : null;
      var key = String((selected && (selected.orderNo || selected.billNo)) || "");
      var rows = (typeof finalOrders !== "undefined" && Array.isArray(finalOrders)) ? finalOrders : [];
      return rows.find(function(order){ return String((order && (order.orderNo || order.billNo)) || "") === key; }) || selected || null;
    }catch(err){
      return null;
    }
  }
  function lineAmountV89(line){
    var type = line.type || line.pack || "";
    return type === "定装" ? nV89(line.qty) * nV89(line.price) : nV89(line.weight) * nV89(line.price);
  }
  function editLinesV89(){
    var order = currentOrderV89();
    return ((order && order.lines) || []).map(function(line, idx){
      var row = document.querySelector('[data-order-edit-line="'+idx+'"]');
      var next = Object.assign({}, line);
      if(row){
        var qty = row.querySelector('[data-order-edit-field="qty"]');
        var weight = row.querySelector('[data-order-edit-field="weight"]');
        var price = row.querySelector('[data-order-edit-field="price"]');
        next.qty = nV89(qty && qty.value);
        next.weight = nV89(weight && weight.value);
        next.price = nV89(price && price.value);
        next.amount = lineAmountV89(next);
      }
      return next;
    });
  }
  function editTotalV89(){
    var lines = editLinesV89();
    var original = lines.reduce(function(sum, line){ return sum + nV89(line.amount); }, 0);
    var discount = Math.min(nV89(document.getElementById("orderEditStep1Discount")?.value), original);
    return Math.max(original - discount, 0);
  }
  function currentModeV89(order){
    var st = String((order && (order.displayStatus || order.status)) || "");
    var total = nV89(order && order.totalAmount);
    var paid = nV89(order && order.paid);
    var debt = nV89(order && order.debt);
    if(st === "已赊欠" || debt > 0){
      return paid > 0 && paid < total ? "mixed" : "debt";
    }
    return "cash";
  }
  function syncPaidByModeV89(force){
    var select = document.getElementById("orderEditStep1PayStatusV89");
    var paid = document.getElementById("orderEditStep1Paid");
    if(!select || !paid) return;
    var total = editTotalV89();
    if(select.value === "cash"){
      paid.value = total.toFixed(2);
      paid.readOnly = true;
    }else if(select.value === "debt"){
      paid.value = "0";
      paid.readOnly = true;
    }else{
      paid.readOnly = false;
      if(force && nV89(paid.value) >= total) paid.value = total > 0 ? Math.max(total / 2, 0).toFixed(2) : "0";
    }
  }
  function decorateSummaryV89(){
    var select = document.getElementById("orderEditStep1PayStatusV89");
    var summary = document.getElementById("orderEditStep1Summary");
    if(!select || !summary || summary.querySelector(".order-edit-step1-status-card-v89")) return;
    var modeText = select.value === "cash" ? "收银结清" : (select.value === "mixed" ? "部分收款" : "赊欠记账");
    var cls = select.value === "cash" ? "cash" : "debt";
    summary.insertAdjacentHTML("beforeend", '<div class="order-edit-step1-status-card-v89 '+cls+'"><span>收银状态</span><b>'+escV89(modeText)+'</b></div><div><span>实收金额</span><b>'+moneyV89(nV89(document.getElementById("orderEditStep1Paid")?.value))+'</b></div>');
  }
  function refreshPreviewV89(forcePaid){
    syncPaidByModeV89(forcePaid);
    if(oldPreviewV89) oldPreviewV89();
    decorateSummaryV89();
  }
  function enhanceOrderEditV89(){
    var body = document.getElementById("orderEditStep1Body");
    var grid = body && body.querySelector(".order-edit-step1-grid");
    if(!grid || document.getElementById("orderEditStep1PayStatusV89")) return;
    var order = currentOrderV89();
    var field = document.createElement("div");
    field.className = "order-edit-step1-field";
    field.innerHTML = '<label>收银状态</label><select id="orderEditStep1PayStatusV89">'
      + '<option value="cash">收银结清</option>'
      + '<option value="debt">赊欠记账</option>'
      + '<option value="mixed">部分收款</option>'
      + '</select><div class="order-edit-step1-payhint-v89">选“赊欠记账”会把实收改为 0，并把应收金额同步为该买家欠款。</div>';
    grid.insertBefore(field, grid.children[1] || null);
    var select = document.getElementById("orderEditStep1PayStatusV89");
    select.value = currentModeV89(order);
    select.addEventListener("change", function(){ refreshPreviewV89(true); });
    var paid = document.getElementById("orderEditStep1Paid");
    if(paid){
      paid.addEventListener("input", function(){
        var sel = document.getElementById("orderEditStep1PayStatusV89");
        if(sel && sel.value !== "mixed" && !paid.readOnly) sel.value = "mixed";
      });
    }
    refreshPreviewV89(false);
  }

  var oldPreviewV89 = typeof window.previewOrderEditStep1 === "function" ? window.previewOrderEditStep1 : null;
  if(oldPreviewV89 && !oldPreviewV89.__payModeV89){
    window.previewOrderEditStep1 = function(){
      syncPaidByModeV89(false);
      var result = oldPreviewV89.apply(this, arguments);
      decorateSummaryV89();
      return result;
    };
    window.previewOrderEditStep1.__payModeV89 = true;
  }

  var oldSaveV89 = typeof window.saveOrderEditStep1 === "function" ? window.saveOrderEditStep1 : null;
  if(oldSaveV89 && !oldSaveV89.__payModeV89){
    window.saveOrderEditStep1 = function(){
      var mode = document.getElementById("orderEditStep1PayStatusV89")?.value || "";
      var customerId = document.getElementById("orderEditStep1Customer")?.value || "";
      if((mode === "debt" || mode === "mixed") && isTempBuyerV89(customerId)){
        alert("临时客户不能赊欠。请先把客户改成正式买家，再保存赊欠订单。");
        return;
      }
      syncPaidByModeV89(true);
      var result = oldSaveV89.apply(this, arguments);
      var order = currentOrderV89();
      if(order && mode){
        if(mode === "cash"){
          order.paid = nV89(order.totalAmount);
          order.debt = 0;
          order.status = "已收银";
          order.displayStatus = "已收银";
        }else if(mode === "debt"){
          order.paid = 0;
          order.debt = nV89(order.totalAmount);
          order.status = "已赊欠";
          order.displayStatus = "已赊欠";
        }else if(mode === "mixed"){
          order.paid = Math.min(nV89(order.paid), nV89(order.totalAmount));
          order.debt = Math.max(nV89(order.totalAmount) - nV89(order.paid), 0);
          order.status = order.debt > 0 ? "已赊欠" : "已收银";
          order.displayStatus = order.status;
        }
        try{ if(typeof renderOrdersCenter === "function") renderOrdersCenter(); }catch(err){}
        try{ if(typeof renderBuyerV47 === "function") renderBuyerV47(); }catch(err){}
        try{ if(typeof renderCashierCustomers === "function") renderCashierCustomers(); }catch(err){}
        try{ if(typeof tudou2SaveNow === "function") setTimeout(tudou2SaveNow, 0); }catch(err){}
      }
      return result;
    };
    window.saveOrderEditStep1.__payModeV89 = true;
  }

  var oldOpenSelectedV89 = typeof window.openSelectedOrderEditStep1 === "function" ? window.openSelectedOrderEditStep1 : null;
  if(oldOpenSelectedV89 && !oldOpenSelectedV89.__payModeV89){
    window.openSelectedOrderEditStep1 = function(){
      var result = oldOpenSelectedV89.apply(this, arguments);
      setTimeout(enhanceOrderEditV89, 0);
      setTimeout(enhanceOrderEditV89, 80);
      return result;
    };
    window.openSelectedOrderEditStep1.__payModeV89 = true;
  }
  document.addEventListener("click", function(ev){
    var btn = ev.target && ev.target.closest ? ev.target.closest("#orderEditStep1Btn") : null;
    if(!btn) return;
    setTimeout(enhanceOrderEditV89, 0);
    setTimeout(enhanceOrderEditV89, 80);
  }, true);
  setTimeout(enhanceOrderEditV89, 0);
})();

/* extracted script block 61 */
/* ===== V90：订单页防闪烁稳定层，只补渲染时序与空值防护 ===== */
(function(){
  function nV90(v){ return Number(v || 0) || 0; }
  function mV90(v){ return typeof money === "function" ? money(v) : nV90(v).toFixed(2); }
  function keyV90(order){ return String((order && (order.orderNo || order.billNo || order.id)) || ""); }
  function orderRowsV90(){
    try{ return (typeof finalOrders !== "undefined" && Array.isArray(finalOrders)) ? finalOrders : []; }catch(err){ return []; }
  }
  function findOrderV90(order){
    var key = keyV90(order);
    if(!key) return order || null;
    return orderRowsV90().find(function(row){ return keyV90(row) === key; }) || order || null;
  }
  function selectedOrderV90(){
    try{
      var selected = typeof currentSelectedOrderRecord === "function" ? currentSelectedOrderRecord() : null;
      return findOrderV90(selected);
    }catch(err){
      return null;
    }
  }
  function isVoidV90(order){
    return !!(order && (order.voided || order.status === "已作废" || order.displayStatus === "已作废"));
  }
  function safePaidV90(order){
    if(!order) return 0;
    try{
      if(typeof buyerV47PaidAmount === "function") return nV90(buyerV47PaidAmount(order));
    }catch(err){}
    return nV90(order.paid);
  }
  function safeDebtV90(order){
    if(!order) return 0;
    try{
      if(typeof buyerV47DebtAmount === "function") return nV90(buyerV47DebtAmount(order));
    }catch(err){}
    var direct = nV90(order.debt);
    if(direct > 0) return direct;
    var status = String(order.displayStatus || order.status || "");
    if(status.includes("赊欠")) return Math.max(0, nV90(order.totalAmount) - safePaidV90(order));
    return 0;
  }
  function installBuyerDebtGuardV90(){
    if(typeof window.buyerV47DebtAmount !== "function" || window.buyerV47DebtAmount.__safeNullV90) return;
    var old = window.buyerV47DebtAmount;
    window.buyerV47DebtAmount = function(order){
      if(!order) return 0;
      try{ return old.apply(this, arguments); }catch(err){
        var direct = nV90(order.debt);
        if(direct > 0) return direct;
        return String(order.displayStatus || order.status || "").includes("赊欠") ? Math.max(0, nV90(order.totalAmount) - nV90(order.paid)) : 0;
      }
    };
    window.buyerV47DebtAmount.__safeNullV90 = true;
  }
  function syncOrderRepayStripV90(order){
    var box = document.getElementById("ordersDetailBody");
    if(!box) return;
    order = findOrderV90(order) || selectedOrderV90();
    var oldStrip = box.querySelector(".order-repay-v81-strip");
    if(!order || isVoidV90(order)){
      if(oldStrip) oldStrip.remove();
      return;
    }
    var debt = safeDebtV90(order);
    var html = '<div class="order-repay-v81-cell"><span>订单金额</span><b>'+mV90(order.totalAmount || 0)+'</b></div>'
      + '<div class="order-repay-v81-cell"><span>已收/已还</span><b>'+mV90(safePaidV90(order))+'</b></div>'
      + '<div class="order-repay-v81-cell debt"><span>剩余欠款</span><b>'+mV90(debt)+'</b></div>'
      + '<button class="order-repay-v81-action" type="button" '+(debt > 0 ? 'onclick="openOrderRepayV81()"' : "disabled")+'>'+(debt > 0 ? "还款" : "已结清")+'</button>';
    if(oldStrip){
      oldStrip.innerHTML = html;
      return;
    }
    var grid = box.querySelector(".order-info-grid");
    if(!grid || !grid.parentNode) return;
    var strip = document.createElement("div");
    strip.className = "order-repay-v81-strip";
    strip.innerHTML = html;
    grid.parentNode.insertBefore(strip, grid.nextSibling);
  }
  function syncOrderRepayButtonV90(order){
    var actions = document.querySelector("#ordersRoot .orders-detail-actions");
    if(!actions) return;
    order = findOrderV90(order) || selectedOrderV90();
    var debt = safeDebtV90(order);
    var btn = document.getElementById("orderRepayV81Btn");
    if(!order || isVoidV90(order) || debt <= 0){
      if(btn) btn.remove();
      return;
    }
    if(!btn){
      btn = document.createElement("button");
      btn.id = "orderRepayV81Btn";
      btn.type = "button";
      btn.className = "btn-blue";
      btn.textContent = "还款";
      btn.onclick = function(){ window.openOrderRepayV81(); };
      var edit = document.getElementById("orderEditStep1Btn");
      if(edit && edit.nextSibling) actions.insertBefore(btn, edit.nextSibling);
      else actions.insertBefore(btn, actions.firstChild);
    }
  }
  function stabilizeOrdersV90(order){
    installBuyerDebtGuardV90();
    syncOrderRepayStripV90(order);
    syncOrderRepayButtonV90(order);
    try{ if(typeof v41SetActive === "function") v41SetActive("orders"); }catch(err){}
    try{ if(typeof v38SyncNavActive === "function") v38SyncNavActive("orders"); }catch(err){}
    try{ if(typeof v40SyncNav === "function") v40SyncNav("orders"); }catch(err){}
  }
  installBuyerDebtGuardV90();

  var oldDetailV90 = typeof window.renderOrderDetail === "function" ? window.renderOrderDetail : null;
  if(oldDetailV90 && !oldDetailV90.__stableV90){
    window.renderOrderDetail = function(order){
      var result = oldDetailV90.apply(this, arguments);
      stabilizeOrdersV90(order);
      return result;
    };
    window.renderOrderDetail.__stableV90 = true;
  }

  var oldCenterV90 = typeof window.renderOrdersCenter === "function" ? window.renderOrdersCenter : null;
  if(oldCenterV90 && !oldCenterV90.__stableV90){
    window.renderOrdersCenter = function(){
      var result = oldCenterV90.apply(this, arguments);
      stabilizeOrdersV90(selectedOrderV90());
      return result;
    };
    window.renderOrdersCenter.__stableV90 = true;
  }

  var oldShowAppPageV90 = typeof window.showAppPage === "function" ? window.showAppPage : null;
  if(oldShowAppPageV90 && !oldShowAppPageV90.__stableOrdersV90){
    window.showAppPage = function(page){
      var next = page === "batch" ? "inbound" : (page === "inventory" ? "stock" : page);
      if(next === "orders" && document.body.classList.contains("show-orders")){
        stabilizeOrdersV90(selectedOrderV90());
        return;
      }
      return oldShowAppPageV90.apply(this, arguments);
    };
    window.showAppPage.__stableOrdersV90 = true;
  }

  document.addEventListener("click", function(ev){
    var btn = ev.target && ev.target.closest ? ev.target.closest("button") : null;
    if(!btn || String(btn.textContent || "").trim() !== "订单") return;
    if(document.body.classList.contains("show-orders")){
      ev.preventDefault();
      ev.stopImmediatePropagation();
      stabilizeOrdersV90(selectedOrderV90());
      return;
    }
    setTimeout(function(){ stabilizeOrdersV90(selectedOrderV90()); }, 0);
  }, true);

  setTimeout(function(){ stabilizeOrdersV90(selectedOrderV90()); }, 0);
})();

/* extracted script block 62 */
/* ===== V91：收银上一单小票 + 订单详情小票打印 ===== */
(function(){
  var activeOrderPrintV91 = null;

  function nV91(v){ return Number(v || 0) || 0; }
  function eV91(v){
    return String(v == null ? "" : v).replace(/[&<>"']/g, function(m){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m];
    });
  }
  function mV91(v){
    try{ return typeof money === "function" ? money(v) : nV91(v).toFixed(2); }catch(err){ return nV91(v).toFixed(2); }
  }
  function keyV91(order){
    return String((order && (order.orderNo || order.billNo || order.id)) || "");
  }
  function ordersV91(){
    try{ return (typeof finalOrders !== "undefined" && Array.isArray(finalOrders)) ? finalOrders : []; }catch(err){ return []; }
  }
  function fullOrderV91(order){
    var key = keyV91(order);
    if(!key) return order || null;
    return ordersV91().find(function(row){ return keyV91(row) === key; }) || order || null;
  }
  function isPrintableOrderV91(order){
    if(!order) return false;
    var st = String(order.displayStatus || order.status || "");
    if(order.voided || st === "已作废" || st === "未下单" || st === "待处理") return false;
    return !!(order.orderNo || order.billNo || (Array.isArray(order.lines) && order.lines.length));
  }
  function latestOrderV91(){
    return ordersV91().find(isPrintableOrderV91) || null;
  }
  function statusV91(order){
    var st = String((order && (order.displayStatus || order.status)) || "");
    if(st === "已下单") return nV91(order && order.debt) > 0 ? "已赊欠" : "已收银";
    if(!st) return nV91(order && order.debt) > 0 ? "已赊欠" : "已收银";
    return st;
  }
  function paidV91(order){
    try{ if(typeof buyerV47PaidAmount === "function") return nV91(buyerV47PaidAmount(order)); }catch(err){}
    return nV91(order && order.paid);
  }
  function debtV91(order){
    try{ if(typeof buyerV47DebtAmount === "function") return nV91(buyerV47DebtAmount(order)); }catch(err){}
    var direct = nV91(order && order.debt);
    if(direct > 0) return direct;
    return statusV91(order).indexOf("赊欠") >= 0 ? Math.max(0, nV91(order && order.totalAmount) - paidV91(order)) : 0;
  }
  function remarkV91(order){
    return (order && (order.orderRemark || order.remark)) || "";
  }
  function merchantV91(){
    var defaults = {
      title:"仓颉商户",
      name:"未设置商户名称",
      address:"未设置商户地址",
      phone:"未设置联系电话"
    };
    try{
      var raw = localStorage.getItem("cangjieMerchantProfileV92");
      var data = raw ? JSON.parse(raw) : {};
      return {
        title:data.title || defaults.title,
        name:data.name || defaults.name,
        address:data.address || defaults.address,
        phone:data.phone || defaults.phone
      };
    }catch(err){
      return defaults;
    }
  }
  function ensurePrintAreaV91(){
    var box = document.getElementById("receiptPrintAreaV91");
    if(!box){
      box = document.createElement("div");
      box.id = "receiptPrintAreaV91";
      document.body.appendChild(box);
    }
    return box;
  }
  function receiptHtmlV91(order, title){
    order = fullOrderV91(order);
    var lines = Array.isArray(order && order.lines) ? order.lines : [];
    var discount = nV91(order && order.discount);
    var total = nV91(order && order.totalAmount);
    var paid = paidV91(order);
    var debt = debtV91(order);
    var merchant = merchantV91();
    var rows = lines.map(function(i, idx){
      var qty = nV91(i.qty);
      var weight = nV91(i.weight);
      var price = nV91(i.price);
      var amount = nV91(i.amount || (String(i.type || "").indexOf("定装") >= 0 ? qty * price : weight * price));
      return '<tr><td colspan="4">'+(idx+1)+'. '+eV91(i.name || "")+'</td></tr>'
        + '<tr><td>'+eV91(qty + (i.unit || "件"))+'</td><td>'+eV91(weight+"斤")+'</td><td>'+mV91(price)+'</td><td class="right">'+mV91(amount)+'</td></tr>';
    }).join("") || '<tr><td colspan="4">暂无商品明细</td></tr>';
    var payLine = debt > 0 ? '<div>赊欠金额：'+mV91(debt)+'</div>' : '<div>实收金额：'+mV91(paid || total)+'</div>';
    return '<div class="receipt-v91">'
      + '<h1>仓颉</h1><h2>'+eV91(title || "销售小票")+'</h2>'
      + '<div class="line"></div>'
      + '<div>商户抬头：'+eV91(merchant.title)+'</div>'
      + '<div>商户名称：'+eV91(merchant.name)+'</div>'
      + '<div>商户地址：'+eV91(merchant.address)+'</div>'
      + '<div>联系电话：'+eV91(merchant.phone)+'</div>'
      + '<div class="line"></div>'
      + '<div>订单号：'+eV91((order && (order.orderNo || order.billNo)) || "")+'</div>'
      + '<div>客户名称：'+eV91((order && order.customerName) || "")+'</div>'
      + '<div>下单时间：'+eV91((order && order.time) || "")+'</div>'
      + '<div>收银状态：'+eV91(statusV91(order))+'</div>'
      + '<div>收银员：'+eV91((order && (order.cashierName || order.cashierPhone || order.cashierRole)) ? ((order.cashierName || order.cashierRole || "管理员") + (order.cashierPhone ? " " + order.cashierPhone : "")) : "管理员")+'</div>'
      + '<div class="line"></div>'
      + '<table><thead><tr><th>件数</th><th>斤数</th><th>单价</th><th class="right">金额</th></tr></thead><tbody>'+rows+'</tbody></table>'
      + '<div class="line"></div>'
      + '<div>优惠金额：'+mV91(discount)+'</div>'
      + ((order && order.discountNote) ? '<div>优惠备注：'+eV91(order.discountNote)+'</div>' : '')
      + '<div>应收金额：'+mV91(total)+'</div>'
      + payLine
      + (remarkV91(order) ? '<div>订单备注：'+eV91(remarkV91(order))+'</div>' : '')
      + '<div class="line"></div>'
      + '<div class="center">谢谢惠顾</div>'
      + '</div>';
  }
  function doPrintV91(order, title){
    order = fullOrderV91(order);
    if(!isPrintableOrderV91(order)){
      alert("暂无可打印订单。");
      return;
    }
    ensurePrintAreaV91().innerHTML = receiptHtmlV91(order, title);
    document.body.classList.add("receipt-printing-v91");
    setTimeout(function(){ window.print(); }, 30);
  }
  function cleanupPrintV91(){
    document.body.classList.remove("receipt-printing-v91");
  }
  window.addEventListener("afterprint", cleanupPrintV91);

  window.refreshLastOrderPrintV91 = function(){
    var btn = document.getElementById("printLastReceiptV91");
    if(!btn) return;
    var order = latestOrderV91();
    if(!order){
      btn.textContent = "暂无上一单可打印";
      btn.disabled = true;
      return;
    }
    btn.disabled = false;
    btn.textContent = "打印上一单｜" + (order.customerName || "") + "｜" + ((order.orderNo || order.billNo) || "") + "｜¥" + mV91(order.totalAmount || 0);
  };
  window.printLastOrderReceiptV91 = function(){
    doPrintV91(latestOrderV91(), "销售小票");
  };
  window.printSelectedOrderReceiptV91 = function(){
    doPrintV91(activeOrderPrintV91, "订单小票");
  };

  function syncOrderPrintButtonV91(order){
    var actions = document.querySelector("#ordersRoot .orders-detail-actions");
    if(!actions) return;
    activeOrderPrintV91 = fullOrderV91(order || (typeof currentSelectedOrderRecord === "function" ? currentSelectedOrderRecord() : null));
    var btn = document.getElementById("orderPrintReceiptV91");
    if(!btn){
      btn = document.createElement("button");
      btn.id = "orderPrintReceiptV91";
      btn.type = "button";
      btn.className = "btn-green";
      btn.onclick = function(){ window.printSelectedOrderReceiptV91(); };
      actions.insertBefore(btn, actions.firstChild);
    }
    var ok = isPrintableOrderV91(activeOrderPrintV91);
    btn.disabled = !ok;
    btn.textContent = ok ? "打印订单" : "请选择订单后打印";
  }

  var oldRenderOrderDetailV91 = typeof window.renderOrderDetail === "function" ? window.renderOrderDetail : null;
  if(oldRenderOrderDetailV91 && !oldRenderOrderDetailV91.__printV91){
    window.renderOrderDetail = function(order){
      var result = oldRenderOrderDetailV91.apply(this, arguments);
      syncOrderPrintButtonV91(order);
      return result;
    };
    window.renderOrderDetail.__printV91 = true;
  }

  ["pushCompletedOrder","confirmOrderFromCodeBill","completeSettleOrder","renderCashierAll","renderOrdersCenter"].forEach(function(name){
    var old = window[name];
    if(typeof old !== "function" || old.__printV91) return;
    window[name] = function(){
      var result = old.apply(this, arguments);
      setTimeout(function(){
        window.refreshLastOrderPrintV91();
        syncOrderPrintButtonV91(activeOrderPrintV91);
      }, 0);
      return result;
    };
    window[name].__printV91 = true;
  });

  setTimeout(function(){
    window.refreshLastOrderPrintV91();
    syncOrderPrintButtonV91(typeof currentSelectedOrderRecord === "function" ? currentSelectedOrderRecord() : null);
  }, 0);
})();

/* extracted script block 63 */
/* ===== V92：个人中心 + 商户资料 localStorage + 导航入口 ===== */
(function(){
  var PROFILE_KEY = "cangjieMerchantProfileV92";
  var LOGIN_KEY = "cangjieMerchantLoginV92";
  var loginMode = "phone";

  function eV92(v){
    return String(v == null ? "" : v).replace(/[&<>"']/g, function(m){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m];
    });
  }
  function readJsonV92(key, fallback){
    try{
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    }catch(err){
      return fallback;
    }
  }
  function writeJsonV92(key, value){
    localStorage.setItem(key, JSON.stringify(value || {}));
  }
  function merchantDefaultsV92(){
    return {
      title:"仓颉商户",
      name:"未设置商户名称",
      address:"未设置商户地址",
      phone:"未设置联系电话"
    };
  }
  function merchantV92(){
    var saved = readJsonV92(PROFILE_KEY, {});
    var d = merchantDefaultsV92();
    return {
      title:saved.title || d.title,
      name:saved.name || d.name,
      address:saved.address || d.address,
      phone:saved.phone || d.phone
    };
  }
  window.getCangjieMerchantProfileV92 = merchantV92;

  function ensureProfileDomV92(){
    if(document.getElementById("profileCenterRootV92")) return;
    var root = document.createElement("div");
    root.id = "profileCenterRootV92";
    root.innerHTML = '<div class="profile-v92-shell">'
      + '<header class="profile-v92-top"><div><h1>个人中心</h1><p>用于后续小程序 / App 登录商家面板；当前版本先保存本机商户资料并联动打印小票。</p></div><div id="profileLoginStatusV92" class="profile-v92-status">未登录</div></header>'
      + '<section class="profile-v92-grid">'
      + '<div class="profile-v92-card"><h2>商家登录</h2><p>当前为前端模拟登录，不接入短信验证码或微信授权。</p>'
      + '<div class="profile-v92-tabs"><button id="profilePhoneTabV92" class="profile-v92-tab active" type="button" data-login-mode-v92="phone">手机号登录</button><button id="profileWechatTabV92" class="profile-v92-tab" type="button" data-login-mode-v92="wechat">微信号登录</button></div>'
      + '<div class="profile-v92-form"><div class="profile-v92-field"><label>手机号</label><input id="profilePhoneV92" inputmode="tel" placeholder="请输入手机号"></div><div class="profile-v92-field"><label>微信号</label><input id="profileWechatV92" placeholder="请输入微信号"></div><button id="profileLoginBtnV92" class="profile-v92-btn" type="button">登录</button></div>'
      + '<div id="profileLoginCardV92" class="profile-v92-info" style="margin-top:14px"></div></div>'
      + '<div class="profile-v92-card"><h2>商户资料设置</h2><p>保存后会写入本机资料，并在打印小票上显示。</p>'
      + '<div class="profile-v92-form profile-v92-merchant-grid"><div class="profile-v92-field"><label>商户抬头</label><input id="merchantTitleV92" placeholder="例如：仓颉商户"></div><div class="profile-v92-field"><label>商户名称</label><input id="merchantNameV92" placeholder="请输入商户名称"></div><div class="profile-v92-field wide"><label>商户地址</label><input id="merchantAddressV92" placeholder="请输入商户地址"></div><div class="profile-v92-field"><label>联系电话</label><input id="merchantPhoneV92" inputmode="tel" placeholder="请输入联系电话"></div><div class="profile-v92-field"><label>&nbsp;</label><button id="merchantSaveBtnV92" class="profile-v92-btn secondary" type="button">保存商户资料</button></div></div>'
      + '<div id="merchantProfileCardV92" class="profile-v92-info" style="margin-top:14px"></div></div>'
      + '</section></div>';
    document.body.appendChild(root);
    document.getElementById("profilePhoneTabV92").addEventListener("click", function(){ window.setProfileLoginModeV92("phone"); });
    document.getElementById("profileWechatTabV92").addEventListener("click", function(){ window.setProfileLoginModeV92("wechat"); });
    document.getElementById("profileLoginBtnV92").addEventListener("click", function(){ window.simulateMerchantLoginV92(); });
    document.getElementById("merchantSaveBtnV92").addEventListener("click", function(){ window.saveMerchantProfileV92(); });
  }

  function renderProfileV92(){
    ensureProfileDomV92();
    var login = readJsonV92(LOGIN_KEY, {});
    var merchant = merchantV92();
    var status = document.getElementById("profileLoginStatusV92");
    if(status) status.textContent = login.loggedIn ? "已登录：" + (login.mode === "wechat" ? (login.wechat || "微信号") : (login.phone || "手机号")) : "未登录";
    var phone = document.getElementById("profilePhoneV92");
    var wechat = document.getElementById("profileWechatV92");
    if(phone && !phone.value) phone.value = login.phone || "";
    if(wechat && !wechat.value) wechat.value = login.wechat || "";
    ["title","name","address","phone"].forEach(function(key){
      var id = key === "title" ? "merchantTitleV92" : key === "name" ? "merchantNameV92" : key === "address" ? "merchantAddressV92" : "merchantPhoneV92";
      var el = document.getElementById(id);
      if(el) el.value = merchant[key] === merchantDefaultsV92()[key] ? "" : merchant[key];
    });
    var loginCard = document.getElementById("profileLoginCardV92");
    if(loginCard){
      loginCard.innerHTML = login.loggedIn
        ? '<div class="profile-v92-info-row"><span>当前商家</span><b>'+eV92(login.mode === "wechat" ? (login.wechat || "微信号商家") : (login.phone || "手机号商家"))+'</b></div><div class="profile-v92-info-row"><span>登录方式</span><b>'+eV92(login.mode === "wechat" ? "微信号登录" : "手机号登录")+'</b></div>'
        : '<div class="profile-v92-info-row"><span>当前商家</span><b>请先模拟登录</b></div>';
    }
    var merchantCard = document.getElementById("merchantProfileCardV92");
    if(merchantCard){
      merchantCard.innerHTML = '<div class="profile-v92-info-row"><span>当前商户抬头</span><b>'+eV92(merchant.title)+'</b></div>'
        + '<div class="profile-v92-info-row"><span>当前商户名称</span><b>'+eV92(merchant.name)+'</b></div>'
        + '<div class="profile-v92-info-row"><span>当前商户地址</span><b>'+eV92(merchant.address)+'</b></div>'
        + '<div class="profile-v92-info-row"><span>当前联系电话</span><b>'+eV92(merchant.phone)+'</b></div>';
    }
  }

  window.setProfileLoginModeV92 = function(mode){
    loginMode = mode === "wechat" ? "wechat" : "phone";
    var phoneTab = document.getElementById("profilePhoneTabV92");
    var wechatTab = document.getElementById("profileWechatTabV92");
    if(phoneTab) phoneTab.classList.toggle("active", loginMode === "phone");
    if(wechatTab) wechatTab.classList.toggle("active", loginMode === "wechat");
  };
  window.simulateMerchantLoginV92 = function(){
    var phone = (document.getElementById("profilePhoneV92")?.value || "").trim();
    var wechat = (document.getElementById("profileWechatV92")?.value || "").trim();
    if(loginMode === "phone" && !phone){
      alert("请先填写手机号。");
      return;
    }
    if(loginMode === "wechat" && !wechat){
      alert("请先填写微信号。");
      return;
    }
    writeJsonV92(LOGIN_KEY, {loggedIn:true, mode:loginMode, phone:phone, wechat:wechat, time:new Date().toLocaleString("zh-CN",{hour12:false})});
    renderProfileV92();
    if(typeof toast === "function") toast("商家已登录");
  };
  window.saveMerchantProfileV92 = function(){
    var data = {
      title:(document.getElementById("merchantTitleV92")?.value || "").trim(),
      name:(document.getElementById("merchantNameV92")?.value || "").trim(),
      address:(document.getElementById("merchantAddressV92")?.value || "").trim(),
      phone:(document.getElementById("merchantPhoneV92")?.value || "").trim()
    };
    writeJsonV92(PROFILE_KEY, data);
    renderProfileV92();
    if(typeof toast === "function") toast("商户资料已保存");
  };

  function hideRootV92(id){
    var el = document.getElementById(id);
    if(el) el.style.setProperty("display", "none", "important");
  }
  function injectProfileNavV92(active){
    var nav = document.getElementById("globalUnifiedNavV41");
    if(!nav) return;
    var btn = nav.querySelector('[data-page="profileV92"],[data-profile-center-v92]');
    if(!btn) return;
    if(active){
      Array.from(nav.querySelectorAll(".v41-nav-btn.active")).forEach(function(item){
        item.classList.remove("active");
      });
    }
    btn.classList.toggle("active", !!active);
    btn.classList.toggle("profile-v92-active", !!active);
  }
  function currentProfileV92(){
    return document.body.classList.contains("show-profile-v92");
  }
  function showProfileV92(){
    ensureProfileDomV92();
    ["cashierRoot","inboundRoot","stockRoot","ordersRoot","inventoryStep1Root","ownerStep1Root","reportsStep1Root","configStep1Root","inventoryView"].forEach(hideRootV92);
    document.body.classList.remove("show-cashier","show-inbound","show-stock","show-orders","inventory-mode","batch-create-mode","batch-overview-mode","buyers-mode-step1");
    document.body.classList.add("show-profile-v92");
    document.getElementById("profileCenterRootV92").style.setProperty("display", "block", "important");
    injectProfileNavV92(true);
    setTimeout(function(){ injectProfileNavV92(true); }, 0);
    setTimeout(function(){ injectProfileNavV92(true); }, 160);
    renderProfileV92();
  }
  window.showProfileCenterV92 = showProfileV92;
  var oldShowAppPageV92 = typeof window.showAppPage === "function" ? window.showAppPage : null;
  window.showAppPage = function(page){
    if(page === "profileV92" || page === "profile" || page === "personalCenter"){
      showProfileV92();
      return;
    }
    document.body.classList.remove("show-profile-v92");
    hideRootV92("profileCenterRootV92");
    var result;
    if(typeof oldShowAppPageV92 === "function") result = oldShowAppPageV92.apply(this, arguments);
    setTimeout(function(){ injectProfileNavV92(false); }, 0);
    setTimeout(function(){ injectProfileNavV92(false); }, 160);
    return result;
  };
  if(typeof window.stableTudou2NavStep1 === "function" && !window.stableTudou2NavStep1.__profileV92){
    var oldStableNavV92 = window.stableTudou2NavStep1;
    window.stableTudou2NavStep1 = function(active){
      var result = oldStableNavV92.apply(this, arguments);
      setTimeout(function(){ injectProfileNavV92(active === "profileV92" || currentProfileV92()); }, 0);
      return result;
    };
    window.stableTudou2NavStep1.__profileV92 = true;
  }
  document.addEventListener("click", function(ev){
    var btn = ev.target && ev.target.closest ? ev.target.closest("[data-profile-center-v92]") : null;
    if(!btn) return;
    ev.preventDefault();
    ev.stopPropagation();
    if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    showProfileV92();
    return false;
  }, true);
  document.addEventListener("click", function(ev){
    var btn = ev.target && ev.target.closest ? ev.target.closest("#globalUnifiedNavV41 [data-page],#globalUnifiedNavV41 [data-config-direct]") : null;
    if(!btn) return;
    if(btn.getAttribute("data-page") !== "profileV92") document.body.classList.remove("show-profile-v92");
  }, false);
  function bootV92(){
    ensureProfileDomV92();
    renderProfileV92();
    injectProfileNavV92(currentProfileV92());
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootV92);
  else bootV92();
  setTimeout(bootV92, 300);
  setTimeout(bootV92, 1000);
})();

/* extracted script block 64 */
/* ===== V93：员工账号与权限控制 ===== */
(function(){
  // 临时降级：避免员工权限包装逻辑影响单文件启动；个人中心与商户小票联动保留。
  return;
  var EMP_KEY = "cangjieEmployeesV93";
  var ACCOUNT_KEY = "cangjieCurrentAccountV93";
  var ADMIN_KEY = "cangjieAdminAccountV93";
  var ORDER_FILTER_KEY = "cangjieOrderCashierFilterV93";
  var orderCashierFilterV93 = localStorage.getItem(ORDER_FILTER_KEY) || "all";

  function nV93(v){ return Number(v || 0) || 0; }
  function eV93(v){
    return String(v == null ? "" : v).replace(/[&<>"']/g, function(m){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m];
    });
  }
  function readV93(key, fallback){
    try{
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    }catch(err){
      return fallback;
    }
  }
  function writeV93(key, value){
    localStorage.setItem(key, JSON.stringify(value));
  }
  function merchantV93(){
    try{
      if(typeof getCangjieMerchantProfileV92 === "function") return getCangjieMerchantProfileV92();
    }catch(err){}
    try{
      return JSON.parse(localStorage.getItem("cangjieMerchantProfileV92") || "{}");
    }catch(err){
      return {};
    }
  }
  function existingLoginV93(){
    return readV93("cangjieMerchantLoginV92", {});
  }
  function ensureAdminV93(){
    var admin = readV93(ADMIN_KEY, null);
    if(admin && admin.role === "管理员") return admin;
    var merchant = merchantV93();
    var login = existingLoginV93();
    admin = {
      id:"admin",
      role:"管理员",
      name:"管理员",
      phone:login.phone || merchant.phone || "",
      wechat:login.wechat || "",
      status:"启用"
    };
    writeV93(ADMIN_KEY, admin);
    return admin;
  }
  function employeesV93(){
    var rows = readV93(EMP_KEY, []);
    return Array.isArray(rows) ? rows : [];
  }
  function saveEmployeesV93(rows){
    writeV93(EMP_KEY, rows || []);
  }
  function currentAccountV93(){
    var account = readV93(ACCOUNT_KEY, null);
    if(account) return account;
    var admin = ensureAdminV93();
    return {
      id:"admin",
      role:"管理员",
      name:admin.name || "管理员",
      phone:admin.phone || "",
      wechat:admin.wechat || "",
      status:"启用",
      authorized:true
    };
  }
  function setAccountV93(account){
    writeV93(ACCOUNT_KEY, account);
    renderAccountBadgeV93();
  }
  function isBlockedV93(){
    var account = currentAccountV93();
    return !!(account && account.blocked);
  }
  function isAdminV93(){
    return currentAccountV93().role === "管理员" && !isBlockedV93();
  }
  function isEmployeeEnabledV93(row){
    return !!(row && row.status === "启用");
  }
  function findEmployeeV93(phone, wechat){
    var p = String(phone || "").trim();
    var w = String(wechat || "").trim();
    return employeesV93().find(function(row){
      return (p && row.phone === p) || (w && row.wechat === w);
    }) || null;
  }
  function accountLabelV93(account){
    account = account || currentAccountV93();
    if(account.blocked) return "未授权账号：" + (account.phone || account.wechat || "未知账号");
    return (account.name || account.role || "管理员") + (account.phone ? " " + account.phone : "");
  }
  function orderRowsV93(){
    try{ return (typeof finalOrders !== "undefined" && Array.isArray(finalOrders)) ? finalOrders : []; }catch(err){ return []; }
  }
  function orderCashierKeyV93(order){
    if(order && order.cashierRole === "员工") return "emp:" + (order.cashierPhone || order.cashierName || "");
    return "admin";
  }
  function stampOrderV93(order){
    if(!order) return order;
    var account = currentAccountV93();
    order.cashierName = account.name || (account.role === "员工" ? "员工" : "管理员");
    order.cashierPhone = account.phone || "";
    order.cashierRole = account.role === "员工" ? "员工" : "管理员";
    return order;
  }
  function employeeStatsV93(row){
    var count = 0;
    var paid = 0;
    orderRowsV93().forEach(function(order){
      if(String(order.cashierPhone || "") !== String(row.phone || "")) return;
      count += 1;
      paid += nV93(order.paid || order.totalAmount);
    });
    return {count:count, paid:paid};
  }
  function moneyV93(v){
    try{ return typeof money === "function" ? money(v) : nV93(v).toFixed(2); }catch(err){ return nV93(v).toFixed(2); }
  }
  function ensureAccountBadgeV93(){
    var badge = document.getElementById("currentAccountBadgeV93");
    if(!badge){
      badge = document.createElement("div");
      badge.id = "currentAccountBadgeV93";
      badge.className = "account-v93-pill";
      document.body.appendChild(badge);
    }
    return badge;
  }
  function renderAccountBadgeV93(){
    var badge = ensureAccountBadgeV93();
    var account = currentAccountV93();
    document.body.classList.toggle("account-blocked-v93", !!account.blocked);
    if(account.blocked){
      document.body.classList.add("show-profile-v92");
      var profile = document.getElementById("profileCenterRootV92");
      if(profile) profile.style.setProperty("display", "block", "important");
    }
    badge.textContent = "当前账号：" + accountLabelV93(account);
    badge.style.display = document.body.classList.contains("show-profile-v92") ? "none" : "flex";
    var profileStatus = document.getElementById("profileLoginStatusV92");
    if(profileStatus) profileStatus.textContent = "当前账号：" + accountLabelV93(account);
  }
  function syncProfileVisibilityV93(){
    var profile = document.getElementById("profileCenterRootV92");
    if(!profile) return;
    if(isBlockedV93()){
      document.body.classList.add("show-profile-v92");
      profile.style.setProperty("display", "block", "important");
      return;
    }
    var businessMode = document.body.classList.contains("show-cashier")
      || document.body.classList.contains("show-stock")
      || document.body.classList.contains("show-orders")
      || document.body.classList.contains("show-inbound")
      || document.body.classList.contains("inventory-mode")
      || document.body.classList.contains("batch-overview-mode")
      || document.body.classList.contains("batch-create-mode");
    if(businessMode){
      document.body.classList.remove("show-profile-v92");
      profile.style.setProperty("display", "none", "important");
    }
  }

  function ensureEmployeeCardV93(){
    var root = document.getElementById("profileCenterRootV92");
    var grid = root && root.querySelector(".profile-v92-grid");
    if(!grid || document.getElementById("employeeCardV93")) return;
    var card = document.createElement("div");
    card.id = "employeeCardV93";
    card.className = "profile-v92-card employee-v93-card";
    card.innerHTML = '<h2>员工账号管理</h2><p>管理员可新增员工账号、启用或停用权限；员工登录后订单会记录开单人。</p>'
      + '<div id="employeeAuthWarningV93"></div>'
      + '<div class="employee-v93-form">'
      + '<div class="profile-v92-field"><label>员工姓名</label><input id="employeeNameV93" placeholder="请输入姓名"></div>'
      + '<div class="profile-v92-field"><label>员工手机号</label><input id="employeePhoneV93" inputmode="tel" placeholder="请输入手机号"></div>'
      + '<div class="profile-v92-field"><label>员工微信号，可选</label><input id="employeeWechatV93" placeholder="请输入微信号"></div>'
      + '<div class="profile-v92-field"><label>员工状态</label><select id="employeeStatusV93"><option value="启用">启用</option><option value="停用">停用</option></select></div>'
      + '<button id="addEmployeeBtnV93" class="profile-v92-btn secondary" type="button">新增员工</button>'
      + '</div><div class="employee-v93-table-wrap"><table class="employee-v93-table"><thead><tr><th>员工姓名</th><th>手机号</th><th>微信号</th><th>状态</th><th>已开单数量</th><th>已收金额</th><th>操作</th></tr></thead><tbody id="employeeListV93"></tbody></table></div>';
    grid.appendChild(card);
    document.getElementById("addEmployeeBtnV93").addEventListener("click", addEmployeeV93);
  }
  function renderEmployeesV93(){
    ensureEmployeeCardV93();
    var warning = document.getElementById("employeeAuthWarningV93");
    var form = document.querySelector("#employeeCardV93 .employee-v93-form");
    var wrap = document.querySelector("#employeeCardV93 .employee-v93-table-wrap");
    if(warning){
      warning.innerHTML = isBlockedV93() ? '<div class="employee-v93-auth-warning">该账号尚未获得商家授权，请联系管理员开通权限。</div>' : "";
    }
    if(form) form.style.display = isAdminV93() ? "grid" : "none";
    if(wrap) wrap.style.display = isAdminV93() ? "block" : "none";
    var tbody = document.getElementById("employeeListV93");
    if(!tbody) return;
    var rows = employeesV93();
    tbody.innerHTML = rows.map(function(row){
      var stats = employeeStatsV93(row);
      var next = row.status === "启用" ? "停用" : "启用";
      return '<tr><td>'+eV93(row.name)+'</td><td>'+eV93(row.phone)+'</td><td>'+eV93(row.wechat || "-")+'</td>'
        + '<td><span class="employee-v93-status '+(row.status === "启用" ? "on" : "off")+'">'+eV93(row.status)+'</span></td>'
        + '<td>'+stats.count+'</td><td>'+moneyV93(stats.paid)+'</td>'
        + '<td><button class="employee-v93-action" type="button" data-toggle-employee-v93="'+eV93(row.id)+'">'+next+'</button></td></tr>';
    }).join("") || '<tr><td colspan="7">暂无员工账号</td></tr>';
    tbody.querySelectorAll("[data-toggle-employee-v93]").forEach(function(btn){
      btn.addEventListener("click", function(){ toggleEmployeeV93(btn.getAttribute("data-toggle-employee-v93")); });
    });
  }
  function addEmployeeV93(){
    if(!isAdminV93()){
      alert("只有管理员可以新增员工账号。");
      return;
    }
    var name = (document.getElementById("employeeNameV93")?.value || "").trim();
    var phone = (document.getElementById("employeePhoneV93")?.value || "").trim();
    var wechat = (document.getElementById("employeeWechatV93")?.value || "").trim();
    var status = document.getElementById("employeeStatusV93")?.value || "启用";
    if(!name || !phone){
      alert("请填写员工姓名和手机号。");
      return;
    }
    var rows = employeesV93();
    var existing = rows.find(function(row){ return row.phone === phone || (wechat && row.wechat === wechat); });
    if(existing){
      existing.name = name;
      existing.phone = phone;
      existing.wechat = wechat;
      existing.status = status;
    }else{
      rows.push({id:"emp_" + Date.now(), name:name, phone:phone, wechat:wechat, status:status});
    }
    saveEmployeesV93(rows);
    ["employeeNameV93","employeePhoneV93","employeeWechatV93"].forEach(function(id){
      var el = document.getElementById(id);
      if(el) el.value = "";
    });
    renderEmployeesV93();
    injectOrderCashierFilterV93();
    if(typeof toast === "function") toast("员工账号已保存");
  }
  function toggleEmployeeV93(id){
    var rows = employeesV93();
    rows.forEach(function(row){
      if(row.id === id) row.status = row.status === "启用" ? "停用" : "启用";
    });
    saveEmployeesV93(rows);
    renderEmployeesV93();
    injectOrderCashierFilterV93();
  }

  var oldSimLoginV93 = window.simulateMerchantLoginV92;
  window.simulateMerchantLoginV92 = function(){
    var mode = document.getElementById("profileWechatTabV92")?.classList.contains("active") ? "wechat" : "phone";
    var phone = (document.getElementById("profilePhoneV92")?.value || "").trim();
    var wechat = (document.getElementById("profileWechatV92")?.value || "").trim();
    var admin = ensureAdminV93();
    var isAdminLogin = (mode === "phone" && phone && phone === admin.phone) || (mode === "wechat" && wechat && wechat === admin.wechat);
    if(isAdminLogin || (!phone && !wechat)){
      setAccountV93({id:"admin", role:"管理员", name:admin.name || "管理员", phone:admin.phone || phone || "", wechat:admin.wechat || wechat || "", status:"启用", authorized:true});
      if(typeof oldSimLoginV93 === "function") try{ oldSimLoginV93.apply(this, arguments); }catch(err){}
      renderEmployeesV93();
      return;
    }
    var employee = findEmployeeV93(phone, wechat);
    if(employee && isEmployeeEnabledV93(employee)){
      setAccountV93({id:employee.id, role:"员工", name:employee.name, phone:employee.phone, wechat:employee.wechat || "", status:employee.status, authorized:true});
      localStorage.setItem("cangjieMerchantLoginV92", JSON.stringify({loggedIn:true, mode:mode, phone:employee.phone, wechat:employee.wechat || "", time:new Date().toLocaleString("zh-CN",{hour12:false})}));
      if(typeof renderProfileV92 === "function") try{ renderProfileV92(); }catch(err){}
      renderEmployeesV93();
      if(typeof toast === "function") toast("员工已登录");
      return;
    }
    setAccountV93({id:"blocked_" + Date.now(), role:"未授权", name:"未授权账号", phone:phone, wechat:wechat, blocked:true, authorized:false});
    localStorage.setItem("cangjieMerchantLoginV92", JSON.stringify({loggedIn:false, mode:mode, phone:phone, wechat:wechat, blocked:true}));
    if(typeof renderProfileV92 === "function") try{ renderProfileV92(); }catch(err){}
    renderEmployeesV93();
    alert("该账号尚未获得商家授权，请联系管理员开通权限");
  };

  var oldShowAppV93 = typeof window.showAppPage === "function" ? window.showAppPage : null;
  window.showAppPage = function(page){
    if(isBlockedV93() && !(page === "profileV92" || page === "profile" || page === "personalCenter")){
      alert("该账号尚未获得商家授权，请联系管理员开通权限");
      if(typeof oldShowAppV93 === "function") return oldShowAppV93.call(this, "profileV92");
      return;
    }
    return oldShowAppV93 ? oldShowAppV93.apply(this, arguments) : undefined;
  };

  var oldPushCompletedOrderV93 = typeof window.pushCompletedOrder === "function" ? window.pushCompletedOrder : null;
  if(oldPushCompletedOrderV93 && !oldPushCompletedOrderV93.__employeeV93){
    window.pushCompletedOrder = function(bill){
      stampOrderV93(bill);
      return oldPushCompletedOrderV93.apply(this, arguments);
    };
    window.pushCompletedOrder.__employeeV93 = true;
  }

  var oldAllOrderRecordsV93 = typeof window.allOrderRecords === "function" ? window.allOrderRecords : null;
  if(oldAllOrderRecordsV93 && !oldAllOrderRecordsV93.__employeeV93){
    window.allOrderRecords = function(){
      var rows = oldAllOrderRecordsV93.apply(this, arguments) || [];
      var account = currentAccountV93();
      if(account.role === "员工"){
        return rows.filter(function(order){ return String(order.cashierPhone || "") === String(account.phone || ""); });
      }
      if(orderCashierFilterV93 && orderCashierFilterV93 !== "all"){
        return rows.filter(function(order){ return orderCashierKeyV93(order) === orderCashierFilterV93; });
      }
      return rows;
    };
    window.allOrderRecords.__employeeV93 = true;
  }

  function injectOrderCashierFilterV93(){
    var head = document.querySelector("#ordersRoot .orders-list-head");
    if(!head) return;
    var select = document.getElementById("orderCashierFilterV93");
    if(!select){
      select = document.createElement("select");
      select.id = "orderCashierFilterV93";
      select.className = "order-cashier-filter-v93";
      select.addEventListener("change", function(){
        orderCashierFilterV93 = select.value || "all";
        localStorage.setItem(ORDER_FILTER_KEY, orderCashierFilterV93);
        if(typeof renderOrdersCenter === "function") renderOrdersCenter();
      });
      var status = document.getElementById("ordersStatusFilter");
      if(status && status.parentNode === head) head.insertBefore(select, status.nextSibling);
      else head.appendChild(select);
    }
    var opts = '<option value="all">全部收银员</option><option value="admin">管理员本人</option>';
    employeesV93().forEach(function(row){
      opts += '<option value="emp:'+eV93(row.phone || row.name)+'">'+eV93(row.name + (row.phone ? " " + row.phone : ""))+'</option>';
    });
    select.innerHTML = opts;
    select.value = orderCashierFilterV93;
    select.style.display = isAdminV93() ? "block" : "none";
  }
  function decorateOrderCashierV93(order){
    var grid = document.querySelector("#ordersDetailBody .order-info-grid");
    if(!grid || !order || document.getElementById("orderCashierInfoV93")) return;
    var card = document.createElement("div");
    card.id = "orderCashierInfoV93";
    card.className = "cashier-v93-card";
    card.innerHTML = '<span>开单人</span><b>'+eV93((order.cashierName || order.cashierRole || "管理员") + (order.cashierPhone ? " " + order.cashierPhone : ""))+'</b>';
    grid.appendChild(card);
  }
  var oldRenderOrderDetailV93 = typeof window.renderOrderDetail === "function" ? window.renderOrderDetail : null;
  if(oldRenderOrderDetailV93 && !oldRenderOrderDetailV93.__employeeV93){
    window.renderOrderDetail = function(order){
      var result = oldRenderOrderDetailV93.apply(this, arguments);
      decorateOrderCashierV93(order);
      return result;
    };
    window.renderOrderDetail.__employeeV93 = true;
  }
  var oldRenderOrdersCenterV93 = typeof window.renderOrdersCenter === "function" ? window.renderOrdersCenter : null;
  if(oldRenderOrdersCenterV93 && !oldRenderOrdersCenterV93.__employeeV93){
    window.renderOrdersCenter = function(){
      injectOrderCashierFilterV93();
      var result = oldRenderOrdersCenterV93.apply(this, arguments);
      injectOrderCashierFilterV93();
      return result;
    };
    window.renderOrdersCenter.__employeeV93 = true;
  }

  var oldRenderProfileV93 = typeof window.renderProfileV92 === "function" ? window.renderProfileV92 : null;
  if(oldRenderProfileV93 && !oldRenderProfileV93.__employeeV93){
    window.renderProfileV92 = function(){
      var result = oldRenderProfileV93.apply(this, arguments);
      renderEmployeesV93();
      renderAccountBadgeV93();
      return result;
    };
    window.renderProfileV92.__employeeV93 = true;
  }
  function bootV93(){
    ensureAdminV93();
    if(!readV93(ACCOUNT_KEY, null)){
      var admin = ensureAdminV93();
      setAccountV93({id:"admin", role:"管理员", name:admin.name || "管理员", phone:admin.phone || "", wechat:admin.wechat || "", status:"启用", authorized:true});
    }
    if(typeof renderProfileV92 === "function") try{ renderProfileV92(); }catch(err){}
    renderEmployeesV93();
    renderAccountBadgeV93();
    injectOrderCashierFilterV93();
    syncProfileVisibilityV93();
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootV93);
  else bootV93();
  setTimeout(bootV93, 300);
  setTimeout(bootV93, 1000);
})();

/* extracted script block 65 */
/* ===== V94：员工权限轻量版，不常驻监听 ===== */
(function(){
  var EMP_KEY = "cangjieEmployeesV94";
  var ACCOUNT_KEY = "cangjieCurrentAccountV94";
  var OWNER_KEY = "cangjieOwnerAccountV96";
  var CURRENT_USER_KEY = "currentUser";
  var FILTER_KEY = "cangjieOrderCashierFilterV94";
  var orderFilter = localStorage.getItem(FILTER_KEY) || "all";
  var NO_PERMISSION_TEXT = "当前账号无权限访问该模块，请联系主账号授权。";
  var PERMISSIONS = ["收银","批次","库存","订单","货主","买家管理","报表","配置","个人中心"];
  var SPECIAL_PERMISSIONS = ["查看全部订单"];
  var PAGE_PERMISSIONS = {
    cashier:"收银",
    inbound:"批次",
    batch:"批次",
    orders:"订单",
    inventoryStep1:"库存",
    stock:"库存",
    ownerStep1:"货主",
    owner:"货主",
    buyersStep1:"买家管理",
    buyer:"买家管理",
    buyers:"买家管理",
    reportsStep1:"报表",
    reports:"报表",
    configStep1:"配置",
    config:"配置",
    profileV92:"个人中心",
    profile:"个人中心",
    personalCenter:"个人中心",
    "收银":"收银",
    "批次":"批次",
    "库存":"库存",
    "订单":"订单",
    "货主":"货主",
    "买家管理":"买家管理",
    "报表":"报表",
    "配置":"配置",
    "个人中心":"个人中心"
  };

  function e(v){
    return String(v == null ? "" : v).replace(/[&<>"']/g, function(m){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m];
    });
  }
  function n(v){ return Number(v || 0) || 0; }
  function moneyText(v){
    try{ return typeof money === "function" ? money(v) : n(v).toFixed(2); }catch(err){ return n(v).toFixed(2); }
  }
  function read(key, fallback){
    try{ var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }catch(err){ return fallback; }
  }
  function write(key, value){
    localStorage.setItem(key, JSON.stringify(value));
  }
  function isAdminAccount(a){
    return !!(a && !a.blocked && (a.role === "owner" || a.role === "管理员"));
  }
  function allPermissions(){
    return PERMISSIONS.slice();
  }
  function normalizeStatus(status){
    return status === "停用" || status === "禁用" ? "禁用" : "启用";
  }
  function defaultPermissions(role){
    if(role === "只读") return ["订单","库存","批次","货主","买家管理","报表","个人中心"];
    if(role === "收银员") return ["收银","订单","库存","个人中心"];
    return allPermissions();
  }
  function normalizePermissions(perms, role){
    var list = Array.isArray(perms) ? perms : [];
    list = list.filter(function(item){ return PERMISSIONS.indexOf(item) >= 0 || SPECIAL_PERMISSIONS.indexOf(item) >= 0; });
    return list.length ? Array.from(new Set(list)) : defaultPermissions(role);
  }
  function normalizeCloudPermissions(perms, role){
    if(Array.isArray(perms)) return normalizePermissions(perms, role);
    if(typeof perms === "string"){
      try{
        return normalizePermissions(JSON.parse(perms), role);
      }catch(err){
        return normalizePermissions(perms.split(/[、,，]/).map(function(item){ return item.trim(); }).filter(Boolean), role);
      }
    }
    return normalizePermissions([], role);
  }
  function normalizeEmployee(row){
    row = row || {};
    var role = row.role && row.role !== "员工" ? row.role : "收银员";
    var employeeId = row.employee_id || row.employeeId || row.id || ("emp_" + Date.now());
    var employeeName = row.employee_name || row.employeeName || row.name || "";
    return {
      id:employeeId,
      employee_id:employeeId,
      employee_name:employeeName,
      name:employeeName,
      phone:row.phone || "",
      wechat:row.wechat || "",
      role:role,
      status:normalizeStatus(row.status),
      permissions:normalizePermissions(row.permissions, role)
    };
  }
  function cloudEmployeeToLocal(row){
    row = row || {};
    var role = row.role || "收银员";
    var employeeId = row.employee_id || row.employeeId || row.id || ("emp_cloud_" + Date.now());
    var employeeName = row.employee_name || row.employeeName || row.name || "";
    return normalizeEmployee({
      id:employeeId,
      employee_id:employeeId,
      employee_name:employeeName,
      name:employeeName,
      phone:row.phone || "",
      wechat:row.wechat || "",
      role:role,
      status:row.status || "启用",
      permissions:normalizeCloudPermissions(row.permissions_json || row.permissions, role),
      cloudEmployeeRowId:row.id || "",
      cloudDeviceId:row.device_id || "",
      cloudUpdatedAt:row.cloud_updated_at || ""
    });
  }
  function permissionChecksHtml(selected){
    selected = Array.isArray(selected) ? selected : allPermissions();
    return '<div class="employee-v93-permissions"><b>权限项预留</b><div class="employee-v93-permission-grid">'
      + PERMISSIONS.concat(SPECIAL_PERMISSIONS).map(function(item){
        return '<label><input type="checkbox" class="employeePermissionV94" value="'+e(item)+'" '+(selected.indexOf(item) >= 0 ? "checked" : "")+'> '+e(item)+'</label>';
      }).join("")
      + '</div></div>';
  }
  function merchant(){
    try{ if(typeof getCangjieMerchantProfileV92 === "function") return getCangjieMerchantProfileV92(); }catch(err){}
    return {};
  }
  function ownerSeed(){
    var savedOwner = read(OWNER_KEY, null) || {};
    var savedAccount = read(ACCOUNT_KEY, null) || {};
    var m = merchant();
    var oldLogin = read("cangjieMerchantLoginV92", {}) || {};
    var accountIsOwner = isAdminAccount(savedAccount);
    return {
      id:"owner",
      employee_id:"owner",
      employee_name:"主账号",
      role:"owner",
      name:"主账号",
      phone:savedOwner.phone || (accountIsOwner ? savedAccount.phone : "") || m.phone || ((oldLogin.loggedIn && oldLogin.mode === "phone") ? oldLogin.phone : "") || "",
      wechat:savedOwner.wechat || (accountIsOwner ? savedAccount.wechat : "") || ((oldLogin.loggedIn && oldLogin.mode === "wechat") ? oldLogin.wechat : "") || "",
      status:"启用",
      permissions:allPermissions(),
      authorized:true
    };
  }
  function employees(){
    var rows = read(EMP_KEY, []);
    return Array.isArray(rows) ? rows.map(normalizeEmployee) : [];
  }
  function saveEmployees(rows){
    write(EMP_KEY, (rows || []).map(normalizeEmployee));
  }
  function appendEmployeeIfMissing(row){
    row = normalizeEmployee(row);
    var rows = employees();
    var hit = rows.find(function(item){
      return (row.phone && item.phone === row.phone) || (row.employee_id && item.employee_id === row.employee_id);
    });
    if(hit) return normalizeEmployee(hit);
    rows.push(row);
    saveEmployees(rows);
    try{ localStorage.setItem("cangjieEmployeesV93", JSON.stringify(rows)); }catch(err){}
    return row;
  }
  function defaultAdmin(){
    return ownerSeed();
  }
  function account(){
    return read(ACCOUNT_KEY, null) || defaultAdmin();
  }
  function userFromAccount(a){
    a = a || defaultAdmin();
    var admin = isAdminAccount(a);
    return {
      phone:a.phone || "",
      employee_id:a.employee_id || a.employeeId || a.id || (admin ? "owner" : ""),
      employee_name:a.employee_name || a.employeeName || a.name || (admin ? "主账号" : "员工"),
      role:a.role || (admin ? "owner" : "员工"),
      permissions:admin ? allPermissions() : normalizePermissions(a.permissions, a.role)
    };
  }
  function persistCurrentUser(a){
    var user = userFromAccount(a || account());
    write(CURRENT_USER_KEY, user);
    window.currentUser = user;
    return user;
  }
  function currentUser(){
    var a = account();
    var saved = read(CURRENT_USER_KEY, null);
    if(saved && String(saved.phone || "") === String(a.phone || "") && String(saved.employee_id || "") === String(a.employee_id || a.employeeId || a.id || "")){
      window.currentUser = saved;
      return saved;
    }
    return persistCurrentUser(a);
  }
  function setAccount(next){
    next = next || defaultAdmin();
    if(isAdminAccount(next)){
      write(OWNER_KEY, {
        id:"owner",
        employee_id:"owner",
        employee_name:"主账号",
        role:"owner",
        name:"主账号",
        phone:next.phone || ownerSeed().phone || "",
        wechat:next.wechat || ownerSeed().wechat || "",
        status:"启用",
        permissions:allPermissions(),
        authorized:true
      });
    }
    write(ACCOUNT_KEY, next);
    persistCurrentUser(next);
    renderAccount();
  }
  function isBlocked(){
    return !!(account() && account().blocked);
  }
  function isAdmin(){
    var a = account();
    return isAdminAccount(a);
  }
  function accountEmployeeId(a){
    a = a || account();
    return a.employee_id || a.employeeId || a.id || (isAdmin() ? "owner" : "");
  }
  function accountPermissions(a){
    a = a || account();
    return isAdmin() ? allPermissions() : normalizePermissions(a.permissions, a.role);
  }
  function hasPermission(name, a){
    if(!name) return true;
    a = a || account();
    if(isAdmin()) return true;
    return accountPermissions(a).indexOf(name) >= 0;
  }
  function canManageEmployees(){
    var a = account();
    return !a.blocked && (isAdmin() || hasPermission("配置", a));
  }
  function canViewAllOrders(a){
    a = a || account();
    return isAdmin() || hasPermission("查看全部订单", a);
  }
  function pagePermission(page, label){
    page = String(page || "");
    if(PAGE_PERMISSIONS[page]) return PAGE_PERMISSIONS[page];
    label = String(label || "").trim();
    return PAGE_PERMISSIONS[label] || label || "";
  }
  function canOpenPage(page, label){
    var a = account();
    if(page === "profileV92" || page === "profile" || page === "personalCenter"){
      if(a.blocked) return true;
      if(isAdmin()) return true;
      return hasPermission("个人中心", a);
    }
    if(a.blocked) return false;
    if(isAdmin()) return true;
    var perm = pagePermission(page, label);
    return !perm || hasPermission(perm, a);
  }
  function applyNavPermissions(){
    var nav = document.getElementById("globalUnifiedNavV41");
    if(!nav) return;
    Array.from(nav.querySelectorAll("[data-page],[data-config-direct]")).forEach(function(btn){
      var page = btn.getAttribute("data-page") || (btn.getAttribute("data-config-direct") === "1" ? "configStep1" : "");
      var allow = canOpenPage(page, btn.textContent || "");
      btn.style.display = allow ? "" : "none";
    });
  }
  function installNavPermissionGuard(){
    if(typeof window.stableTudou2NavStep1 === "function" && !window.stableTudou2NavStep1.__employeePermissionV95){
      var oldStable = window.stableTudou2NavStep1;
      window.stableTudou2NavStep1 = function(active){
        var result = oldStable.apply(this, arguments);
        setTimeout(applyNavPermissions, 0);
        setTimeout(applyNavPermissions, 80);
        return result;
      };
      window.stableTudou2NavStep1.__employeePermissionV95 = true;
    }
    var nav = document.getElementById("globalUnifiedNavV41");
    if(nav && !nav.__employeePermissionObserverV95 && typeof MutationObserver !== "undefined"){
      var observer = new MutationObserver(function(){ setTimeout(applyNavPermissions, 0); });
      observer.observe(nav, {childList:true});
      nav.__employeePermissionObserverV95 = observer;
    }
  }
  function accountLabel(a){
    a = a || account();
    if(a.blocked) return "未授权账号：" + (a.phone || a.wechat || "未知账号");
    return (a.name || a.role || "管理员") + (a.phone ? " " + a.phone : "");
  }
  function findEmployee(phone, wechat){
    phone = String(phone || "").trim();
    wechat = String(wechat || "").trim();
    return employees().find(function(row){
      return (phone && row.phone === phone) || (wechat && row.wechat === wechat);
    }) || null;
  }
  function employeeLoginTable(client){
    return (client && typeof client.schema === "function") ? client.schema("public").from("employees") : (client ? client.from("employees") : null);
  }
  function supabaseForEmployeeLogin(){
    return window.CANGJIE_SUPABASE_CLIENT || window.cangjieSupabase || null;
  }
  async function findCloudEmployeeByPhone(phone){
    var client = supabaseForEmployeeLogin();
    if(!client || !phone) return null;
    try{
      var merchantId = typeof window.getCurrentMerchantId === "function"
        ? window.getCurrentMerchantId()
        : ((read("cangjieCommercialSyncV1", {}) || {}).merchantId || "");
      var query = employeeLoginTable(client)
        .select("*")
        .eq("merchant_id", merchantId)
        .eq("phone", phone)
        .eq("status", "启用")
        .order("cloud_updated_at", {ascending:false})
        .limit(1);
      var result = await query;
      console.log("手机号登录云端员工查询:", result.data, result.error);
      if(result.error) return null;
      return (result.data || [])[0] || null;
    }catch(err){
      console.error("手机号登录云端员工查询异常:", err);
      return null;
    }
  }
  function orderRows(){
    try{ return Array.isArray(finalOrders) ? finalOrders : []; }catch(err){ return []; }
  }
  function orderKey(order){
    var role = order && (order.employeeRole || order.cashierRole || "");
    if(order && role && role !== "管理员" && role !== "owner") return "emp:" + (order.employee_id || order.employeeId || order.cashierPhone || order.cashierName || "");
    return "admin";
  }
  function orderBelongsToAccount(order, a){
    a = a || account();
    if(canViewAllOrders(a)) return true;
    var employeeId = accountEmployeeId(a);
    var sameId = String(order && (order.employee_id || order.employeeId || order.userId || "")) === String(employeeId || "");
    var samePhone = String(order && (order.employee_phone || order.employeePhone || order.cashierPhone || "")) === String(a.phone || "");
    return sameId || samePhone;
  }
  function filterOrdersForAccount(rows, a){
    rows = Array.isArray(rows) ? rows : [];
    a = a || account();
    if(canViewAllOrders(a)) return rows;
    return rows.filter(function(order){ return orderBelongsToAccount(order, a); });
  }
  function stampOrder(order){
    var a = account();
    if(!order || a.blocked) return order;
    var user = currentUser();
    var employeeId = user.employee_id || accountEmployeeId(a);
    var employeeName = user.employee_name || a.employee_name || a.name || (isAdmin() ? "主账号" : "员工");
    order.employee_id = order.employee_id || employeeId;
    order.employeeId = order.employeeId || employeeId;
    order.employee_name = order.employee_name || employeeName;
    order.employeeName = order.employeeName || employeeName;
    order.employeeRole = order.employeeRole || (isAdmin() ? "管理员" : (user.role || a.role));
    order.userId = order.userId || employeeId;
    order.employee_phone = order.employee_phone || user.phone || a.phone || "";
    order.employeePhone = order.employeePhone || user.phone || a.phone || "";
    order.cashierName = employeeName;
    order.cashierPhone = user.phone || a.phone || "";
    order.cashierRole = isAdmin() ? "管理员" : (user.role || a.role);
    return order;
  }
  function stats(row){
    row = normalizeEmployee(row);
    var count = 0;
    var paid = 0;
    orderRows().forEach(function(order){
      var sameId = String(order.employee_id || order.employeeId || "") === String(row.employee_id || "");
      var samePhone = String(order.cashierPhone || "") === String(row.phone || "");
      if(!sameId && !samePhone) return;
      count += 1;
      paid += n(order.paid || order.totalAmount);
    });
    return {count:count, paid:paid};
  }

  function ensureBadge(){
    var badge = document.getElementById("currentAccountBadgeV94");
    if(!badge){
      badge = document.createElement("div");
      badge.id = "currentAccountBadgeV94";
      badge.className = "account-v93-pill";
      document.body.appendChild(badge);
    }
    return badge;
  }
  function renderAccount(){
    var a = account();
    var badge = document.getElementById("currentAccountBadgeV94");
    if(badge) badge.style.display = "none";
    var status = document.getElementById("profileLoginStatusV92");
    if(status) status.style.display = "inline-flex";
    if(status) status.textContent = "当前账号：" + accountLabel(a);
    document.body.classList.toggle("account-blocked-v93", !!a.blocked);
    applyNavPermissions();
    if(a.blocked){
      var profile = document.getElementById("profileCenterRootV92");
      if(profile) profile.style.setProperty("display", "block", "important");
      document.body.classList.add("show-profile-v92");
    }
    renderPhoneLoginCard();
  }

  function ensurePhoneLoginCard(){
    var root = document.getElementById("profileCenterRootV92");
    var grid = root && root.querySelector(".profile-v92-grid");
    if(!grid || document.getElementById("phoneSwitchCardV96")) return;
    var card = document.createElement("div");
    card.id = "phoneSwitchCardV96";
    card.className = "profile-v92-card";
    card.innerHTML = '<h2>手机号登录 / 切换账号</h2><p>输入主账号手机号或已授权员工手机号，系统会按身份加载对应权限。</p>'
      + '<div class="profile-v92-form"><div class="profile-v92-field"><label>手机号</label><input id="phoneSwitchInputV96" inputmode="tel" placeholder="请输入主账号或员工手机号"></div><button id="phoneSwitchLoginBtnV96" class="profile-v92-btn secondary" type="button">登录 / 切换账号</button></div>'
      + '<div id="currentUserCardV96" class="profile-v92-info" style="margin-top:14px"></div>';
    grid.insertBefore(card, grid.children[1] || null);
    var btn = document.getElementById("phoneSwitchLoginBtnV96");
    if(btn) btn.addEventListener("click", function(){ window.loginByPhoneV96(); });
    var input = document.getElementById("phoneSwitchInputV96");
    if(input) input.addEventListener("keydown", function(ev){
      if(ev.key === "Enter"){
        ev.preventDefault();
        window.loginByPhoneV96();
      }
    });
  }
  function renderPhoneLoginCard(){
    ensurePhoneLoginCard();
    var card = document.getElementById("currentUserCardV96");
    var input = document.getElementById("phoneSwitchInputV96");
    var a = account();
    var user = currentUser();
    if(input && !input.value) input.value = user.phone || a.phone || "";
    if(card){
      if(a.blocked){
        card.innerHTML = '<div class="profile-v92-info-row"><span>当前登录身份</span><b>未授权手机号</b></div>'
          + '<div class="profile-v92-info-row"><span>手机号</span><b>'+e(user.phone || a.phone || "-")+'</b></div>'
          + '<div class="profile-v92-info-row"><span>角色</span><b>未授权</b></div>'
          + '<div class="profile-v92-info-row"><span>状态</span><b>该手机号尚未被主账号授权</b></div>';
      }else{
        card.innerHTML = '<div class="profile-v92-info-row"><span>当前登录身份</span><b>'+e(isAdminAccount(a) ? "主账号" : (user.role || "员工"))+'</b></div>'
          + '<div class="profile-v92-info-row"><span>姓名</span><b>'+e(user.employee_name || "-")+'</b></div>'
          + '<div class="profile-v92-info-row"><span>手机号</span><b>'+e(user.phone || "-")+'</b></div>'
          + '<div class="profile-v92-info-row"><span>角色</span><b>'+e(isAdminAccount(a) ? "owner" : (user.role || "-"))+'</b></div>'
          + '<div class="profile-v92-info-row"><span>员工ID</span><b>'+e(user.employee_id || "-")+'</b></div>'
          + '<div class="profile-v92-info-row"><span>权限</span><b>'+e((user.permissions || []).join("、") || "-")+'</b></div>';
      }
    }
  }
  async function loginByPhone(phone){
    phone = String(phone || "").trim();
    if(!phone){
      alert("请先填写手机号。");
      return false;
    }
    var admin = defaultAdmin();
    if(admin.phone && phone === admin.phone){
      setAccount({id:"owner", employee_id:"owner", employee_name:"主账号", role:"owner", name:"主账号", phone:phone, wechat:admin.wechat || "", status:"启用", permissions:allPermissions(), authorized:true});
      localStorage.setItem("cangjieMerchantLoginV92", JSON.stringify({loggedIn:true, mode:"phone", phone:phone, wechat:admin.wechat || "", time:new Date().toLocaleString("zh-CN",{hour12:false})}));
      renderPhoneLoginCard();
      renderEmployees();
      applyNavPermissions();
      injectOrderFilter();
      if(typeof renderProfileV92 === "function") try{ renderProfileV92(); }catch(err){}
      if(typeof toast === "function") toast("主账号已登录");
      return true;
    }
    var emp = findEmployee(phone, "");
    if(!emp){
      var cloudRow = await findCloudEmployeeByPhone(phone);
      if(cloudRow){
        emp = appendEmployeeIfMissing(cloudEmployeeToLocal(cloudRow));
      }
    }
    if(emp && emp.status === "启用"){
      setAccount({id:emp.employee_id, employee_id:emp.employee_id, employee_name:emp.employee_name, role:emp.role, name:emp.employee_name, phone:emp.phone, wechat:emp.wechat || "", status:emp.status, permissions:emp.permissions, authorized:true});
      localStorage.setItem("cangjieMerchantLoginV92", JSON.stringify({loggedIn:true, mode:"phone", phone:emp.phone, wechat:emp.wechat || "", time:new Date().toLocaleString("zh-CN",{hour12:false})}));
      renderPhoneLoginCard();
      renderEmployees();
      applyNavPermissions();
      injectOrderFilter();
      if(typeof renderProfileV92 === "function") try{ renderProfileV92(); }catch(err){}
      if(typeof toast === "function") toast("员工已登录");
      return true;
    }
    if(typeof window.createCustomerTestLoginV1 === "function"){
      window.createCustomerTestLoginV1(phone);
      renderPhoneLoginCard();
      renderEmployees();
      applyNavPermissions();
      injectOrderFilter();
      if(typeof renderProfileV92 === "function") try{ renderProfileV92(); }catch(err){}
      if(typeof toast === "function") toast("客户测试账号已登录");
      return true;
    }
    setAccount({id:"blocked_" + Date.now(), employee_id:"", employee_name:"未授权账号", role:"未授权", name:"未授权账号", phone:phone, wechat:"", status:"禁用", permissions:[], blocked:true, authorized:false});
    localStorage.setItem("cangjieMerchantLoginV92", JSON.stringify({loggedIn:false, mode:"phone", phone:phone, blocked:true}));
    renderPhoneLoginCard();
    renderEmployees();
    applyNavPermissions();
    alert("该手机号尚未被主账号授权，请联系主账号添加员工权限。");
    return false;
  }
  window.loginByPhoneV96 = function(){
    var phone = (document.getElementById("phoneSwitchInputV96")?.value || document.getElementById("profilePhoneV92")?.value || "").trim();
    return loginByPhone(phone);
  };

  function ensureEmployeeCard(){
    var root = document.getElementById("profileCenterRootV92");
    var grid = root && root.querySelector(".profile-v92-grid");
    if(!grid || document.getElementById("employeeCardV94")) return;
    var card = document.createElement("div");
    card.id = "employeeCardV94";
    card.className = "profile-v92-card employee-v93-card";
    card.innerHTML = '<h2>员工权限管理</h2><p>主账号可新增员工账号并配置模块权限；员工登录后只能看到已授权模块，订单会记录开单人。</p>'
      + '<div id="employeeAuthWarningV94"></div>'
      + '<div class="employee-v93-form" id="employeeFormV94">'
      + '<div class="profile-v92-field"><label>员工姓名</label><input id="employeeNameV94" placeholder="请输入姓名"></div>'
      + '<div class="profile-v92-field"><label>员工手机号</label><input id="employeePhoneV94" inputmode="tel" placeholder="请输入手机号"></div>'
      + '<div class="profile-v92-field"><label>员工微信号，可选</label><input id="employeeWechatV94" placeholder="请输入微信号"></div>'
      + '<div class="profile-v92-field"><label>角色</label><select id="employeeRoleV94"><option value="收银员">收银员</option><option value="管理员">管理员</option><option value="只读">只读</option></select></div>'
      + '<div class="profile-v92-field"><label>状态</label><select id="employeeStatusV94"><option value="启用">启用</option><option value="禁用">禁用</option></select></div>'
      + permissionChecksHtml(allPermissions())
      + '<button id="addEmployeeBtnV94" class="profile-v92-btn secondary" type="button">新增员工</button>'
      + '</div><div class="employee-cloud-v95-actions" id="employeeCloudActionsV95"><button id="pushEmployeesCloudV95" type="button" onclick="pushEmployeesToCloud()">上传员工权限</button><button id="readCloudEmployeesV95" class="secondary" type="button" onclick="readCloudEmployees()">读取云端员工</button><button id="mergeCloudEmployeesV95" class="secondary" type="button" onclick="mergeCloudEmployeesToLocal()">合并云端员工</button><span id="employeeCloudStatus" class="employee-cloud-v95-status">未同步员工权限</span></div><div class="employee-v93-table-wrap" id="employeeTableWrapV94"><table class="employee-v93-table"><thead><tr><th>员工ID</th><th>员工姓名</th><th>手机号</th><th>角色</th><th>状态</th><th>权限</th><th>已开单数量</th><th>已收金额</th><th>操作</th></tr></thead><tbody id="employeeListV94"></tbody></table></div>';
    grid.appendChild(card);
  }
  function renderEmployees(){
    renderPhoneLoginCard();
    ensureEmployeeCard();
    var warning = document.getElementById("employeeAuthWarningV94");
    if(warning) warning.innerHTML = isBlocked() ? '<div class="employee-v93-auth-warning">该账号尚未获得商家授权，请联系管理员开通权限。</div>' : "";
    var form = document.getElementById("employeeFormV94");
    var wrap = document.getElementById("employeeTableWrapV94");
    var cloudActions = document.getElementById("employeeCloudActionsV95");
    var canManage = canManageEmployees();
    if(form) form.style.display = canManage ? "grid" : "none";
    if(wrap) wrap.style.display = canManage ? "block" : "none";
    if(cloudActions) cloudActions.style.display = "none";
    if(warning && !isBlocked() && !canManage){
      warning.innerHTML = '<div class="employee-v93-auth-warning">'+NO_PERMISSION_TEXT+'</div>';
    }
    var tbody = document.getElementById("employeeListV94");
    if(!tbody) return;
    var rows = employees();
    function shortEmployeeId(id){
      id = String(id || "");
      return id.length > 8 ? id.slice(0, 8) + "..." : (id || "-");
    }
    function permissionTags(list){
      list = Array.isArray(list) ? list : [];
      if(!list.length) return '<span class="employee-v93-empty">未设置</span>';
      return '<div class="employee-v93-permission-tags">' + list.map(function(item){
        return '<span class="employee-v93-permission-tag">'+e(item)+'</span>';
      }).join("") + '</div>';
    }
    tbody.innerHTML = rows.map(function(row){
      var st = stats(row);
      var next = row.status === "启用" ? "禁用" : "启用";
      return '<tr><td data-label="员工ID"><span class="employee-v93-id" title="'+e(row.employee_id || "")+'">'+e(shortEmployeeId(row.employee_id))+'</span></td>'
        + '<td data-label="员工姓名">'+e(row.employee_name)+'</td><td data-label="手机号">'+e(row.phone)+'</td>'
        + '<td data-label="角色">'+e(row.role)+'</td>'
        + '<td data-label="状态"><span class="employee-v93-status '+(row.status === "启用" ? "on" : "off")+'">'+e(row.status)+'</span></td>'
        + '<td data-label="权限">'+permissionTags(row.permissions || [])+'</td>'
        + '<td data-label="已开单数量">'+st.count+'</td><td data-label="已收金额">'+moneyText(st.paid)+'</td>'
        + '<td data-label="操作"><button class="employee-v93-action" type="button" data-toggle-employee-v94="'+e(row.id)+'">'+next+'</button></td></tr>';
    }).join("") || '<tr><td colspan="9">暂无员工账号</td></tr>';
  }
  function addEmployee(){
    if(!canManageEmployees()){
      alert(NO_PERMISSION_TEXT);
      return;
    }
    var name = (document.getElementById("employeeNameV94")?.value || "").trim();
    var phone = (document.getElementById("employeePhoneV94")?.value || "").trim();
    var wechat = (document.getElementById("employeeWechatV94")?.value || "").trim();
    var role = document.getElementById("employeeRoleV94")?.value || "收银员";
    var status = normalizeStatus(document.getElementById("employeeStatusV94")?.value || "启用");
    var permissions = Array.from(document.querySelectorAll(".employeePermissionV94:checked")).map(function(el){ return el.value; });
    permissions = normalizePermissions(permissions, role);
    if(!name || !phone){
      alert("请填写员工姓名和手机号。");
      return;
    }
    var rows = employees();
    var hit = rows.find(function(row){ return row.phone === phone || (wechat && row.wechat === wechat); });
    if(hit){
      hit.employee_name = name;
      hit.name = name;
      hit.phone = phone;
      hit.wechat = wechat;
      hit.role = role;
      hit.status = status;
      hit.permissions = permissions;
    }else{
      rows.push({id:"emp_" + Date.now(), employee_id:"emp_" + Date.now(), employee_name:name, name:name, phone:phone, wechat:wechat, role:role, status:status, permissions:permissions});
    }
    saveEmployees(rows);
    ["employeeNameV94","employeePhoneV94","employeeWechatV94"].forEach(function(id){
      var el = document.getElementById(id);
      if(el) el.value = "";
    });
    renderEmployees();
    applyNavPermissions();
    injectOrderFilter();
    if(typeof toast === "function") toast("员工账号已保存");
  }
  function toggleEmployee(id){
    if(!canManageEmployees()){
      alert(NO_PERMISSION_TEXT);
      return;
    }
    var rows = employees();
    rows.forEach(function(row){
      if(row.id === id) row.status = row.status === "启用" ? "禁用" : "启用";
    });
    saveEmployees(rows);
    renderEmployees();
    applyNavPermissions();
    injectOrderFilter();
  }

  var oldLogin = window.simulateMerchantLoginV92;
  window.simulateMerchantLoginV92 = function(){
    var mode = document.getElementById("profileWechatTabV92")?.classList.contains("active") ? "wechat" : "phone";
    var phone = (document.getElementById("profilePhoneV92")?.value || "").trim();
    var wechat = (document.getElementById("profileWechatV92")?.value || "").trim();
    if(mode === "phone"){
      return loginByPhone(phone);
    }
    var admin = defaultAdmin();
    var adminLogin = (phone && phone === admin.phone) || (wechat && wechat === admin.wechat);
    if(adminLogin || (!phone && !wechat)){
      setAccount({id:"owner", employee_id:"owner", employee_name:"主账号", role:"owner", name:"主账号", phone:phone || admin.phone || "", wechat:wechat || admin.wechat || "", status:"启用", permissions:allPermissions(), authorized:true});
      if(typeof oldLogin === "function") try{ oldLogin.apply(this, arguments); }catch(err){}
      renderEmployees();
      applyNavPermissions();
      return;
    }
    var emp = findEmployee(phone, wechat);
    if(emp && emp.status === "启用"){
      setAccount({id:emp.employee_id, employee_id:emp.employee_id, employee_name:emp.employee_name, role:emp.role, name:emp.employee_name, phone:emp.phone, wechat:emp.wechat || "", status:emp.status, permissions:emp.permissions, authorized:true});
      localStorage.setItem("cangjieMerchantLoginV92", JSON.stringify({loggedIn:true, mode:mode, phone:emp.phone, wechat:emp.wechat || "", time:new Date().toLocaleString("zh-CN",{hour12:false})}));
      renderAccount();
      renderEmployees();
      applyNavPermissions();
      if(typeof toast === "function") toast("员工已登录");
      return;
    }
    setAccount({id:"blocked_" + Date.now(), role:"未授权", name:"未授权账号", phone:phone, wechat:wechat, blocked:true, authorized:false});
    renderAccount();
    renderEmployees();
    alert("该账号尚未获得商家授权，请联系管理员开通权限");
  };

  var oldShow = typeof window.showAppPage === "function" ? window.showAppPage : null;
  window.showAppPage = function(page){
    if(isBlocked() && !(page === "profileV92" || page === "profile" || page === "personalCenter")){
      alert("该账号尚未获得商家授权，请联系管理员开通权限");
      return oldShow ? oldShow.call(this, "profileV92") : undefined;
    }
    if(!canOpenPage(page, "")){
      alert(NO_PERMISSION_TEXT);
      return undefined;
    }
    var result = oldShow ? oldShow.apply(this, arguments) : undefined;
    setTimeout(function(){
      renderAccount();
      applyNavPermissions();
      if(page === "profileV92" || page === "profile" || page === "personalCenter") renderEmployees();
      if(page === "orders") injectOrderFilter();
    }, 0);
    return result;
  };

  var oldPush = typeof window.pushCompletedOrder === "function" ? window.pushCompletedOrder : null;
  if(oldPush && !oldPush.__employeeV94){
    window.pushCompletedOrder = function(bill){
      stampOrder(bill);
      return oldPush.apply(this, arguments);
    };
    window.pushCompletedOrder.__employeeV94 = true;
  }

  var oldAllOrders = typeof window.allOrderRecords === "function" ? window.allOrderRecords : null;
  if(oldAllOrders && !oldAllOrders.__employeeV94){
    window.allOrderRecords = function(){
      var rows = oldAllOrders.apply(this, arguments) || [];
      var a = account();
      if(!canViewAllOrders(a)){
        return filterOrdersForAccount(rows, a);
      }
      if(orderFilter && orderFilter !== "all"){
        return rows.filter(function(order){ return orderKey(order) === orderFilter; });
      }
      return rows;
    };
    window.allOrderRecords.__employeeV94 = true;
  }

  function injectOrderFilter(){
    var head = document.querySelector("#ordersRoot .orders-list-head");
    if(!head) return;
    var sel = document.getElementById("orderCashierFilterV94");
    if(!sel){
      sel = document.createElement("select");
      sel.id = "orderCashierFilterV94";
      sel.className = "order-cashier-filter-v93";
      sel.addEventListener("change", function(){
        orderFilter = sel.value || "all";
        localStorage.setItem(FILTER_KEY, orderFilter);
        if(typeof renderOrdersCenter === "function") renderOrdersCenter();
      });
      head.appendChild(sel);
    }
    var html = '<option value="all">全部收银员</option><option value="admin">主账号 / 管理员</option>';
    employees().forEach(function(row){
      html += '<option value="emp:'+e(row.employee_id)+'">'+e(row.employee_name + (row.phone ? " " + row.phone : "") + "｜" + row.role)+'</option>';
    });
    sel.innerHTML = html;
    sel.value = orderFilter;
    sel.style.display = isAdmin() ? "block" : "none";
  }

  function decorateOrder(order){
    var grid = document.querySelector("#ordersDetailBody .order-info-grid");
    if(!grid || !order || document.getElementById("orderCashierInfoV94")) return;
    var card = document.createElement("div");
    card.id = "orderCashierInfoV94";
    card.className = "cashier-v93-card";
    card.innerHTML = '<span>开单人</span><b>'+e((order.employee_name || order.employeeName || order.cashierName || order.cashierRole || "管理员") + (order.cashierPhone ? " " + order.cashierPhone : ""))+'</b>';
    grid.appendChild(card);
  }
  var oldDetail = typeof window.renderOrderDetail === "function" ? window.renderOrderDetail : null;
  if(oldDetail && !oldDetail.__employeeV94){
    window.renderOrderDetail = function(order){
      var result = oldDetail.apply(this, arguments);
      decorateOrder(order);
      return result;
    };
    window.renderOrderDetail.__employeeV94 = true;
  }
  var oldCenter = typeof window.renderOrdersCenter === "function" ? window.renderOrdersCenter : null;
  if(oldCenter && !oldCenter.__employeeV94){
    window.renderOrdersCenter = function(){
      var result = oldCenter.apply(this, arguments);
      injectOrderFilter();
      return result;
    };
    window.renderOrdersCenter.__employeeV94 = true;
  }

  document.addEventListener("click", function(ev){
    var addBtn = ev.target && ev.target.closest ? ev.target.closest("#addEmployeeBtnV94") : null;
    if(addBtn){
      ev.preventDefault();
      addEmployee();
      return;
    }
    var toggle = ev.target && ev.target.closest ? ev.target.closest("[data-toggle-employee-v94]") : null;
    if(toggle){
      ev.preventDefault();
      toggleEmployee(toggle.getAttribute("data-toggle-employee-v94"));
      return;
    }
    var profileBtn = ev.target && ev.target.closest ? ev.target.closest("[data-profile-center-v92]") : null;
    if(profileBtn) setTimeout(function(){ renderEmployees(); renderAccount(); }, 0);
    var nav = ev.target && ev.target.closest ? ev.target.closest("#globalUnifiedNavV41 [data-page],#globalUnifiedNavV41 [data-config-direct]") : null;
    var navPage = nav ? (nav.getAttribute("data-page") || (nav.getAttribute("data-config-direct") === "1" ? "configStep1" : "")) : "";
    if(nav && isBlocked()){
      ev.preventDefault();
      ev.stopPropagation();
      if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      alert("该账号尚未获得商家授权，请联系管理员开通权限");
      if(typeof window.showAppPage === "function") window.showAppPage("profileV92");
    }
    if(nav && !canOpenPage(navPage, nav.textContent || "")){
      ev.preventDefault();
      ev.stopPropagation();
      if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      alert(NO_PERMISSION_TEXT);
    }
  }, true);

  function boot(){
    installNavPermissionGuard();
    var savedAccount = read(ACCOUNT_KEY, null);
    if(!savedAccount){
      setAccount(defaultAdmin());
    }else if((savedAccount.id === "admin" || !savedAccount.employee_id) && savedAccount.role === "管理员"){
      savedAccount.id = "owner";
      savedAccount.employee_id = "owner";
      savedAccount.employee_name = savedAccount.employee_name || savedAccount.name || "主账号";
      savedAccount.name = savedAccount.name || "主账号";
      savedAccount.role = "owner";
      savedAccount.permissions = allPermissions();
      setAccount(savedAccount);
    }
    renderAccount();
    renderEmployees();
    applyNavPermissions();
    installNavPermissionGuard();
    injectOrderFilter();
  }
  window.renderEmployeesV94 = renderEmployees;
  window.getEmployeesV94 = employees;
  window.saveEmployeesV94 = saveEmployees;
  window.getCurrentUserV96 = currentUser;
  window.cangjieCurrentAccountV94 = account;
  window.cangjieCanViewAllOrdersV94 = canViewAllOrders;
  window.cangjieOrderBelongsToCurrentAccountV94 = function(order){ return orderBelongsToAccount(order, account()); };
  window.cangjieFilterOrdersForCurrentAccountV94 = function(rows){ return filterOrdersForAccount(rows, account()); };
  window.cangjieEmployeeSalesSummaryV94 = function(rows){
    rows = Array.isArray(rows) ? rows : [];
    var map = {};
    function ensure(id, name, phone){
      id = id || "owner";
      if(!map[id]){
        map[id] = {employee_id:id, employee_name:name || (id === "owner" ? "主账号" : "未命名员工"), phone:phone || "", orderCount:0, salesAmount:0, paidAmount:0, debtAmount:0, cashAmount:0, wechatAmount:0, alipayAmount:0, bankAmount:0, debtMethodAmount:0};
      }
      if(name && map[id].employee_name === "未命名员工") map[id].employee_name = name;
      if(phone && !map[id].phone) map[id].phone = phone;
      return map[id];
    }
    if(canViewAllOrders(account())){
      var admin = defaultAdmin();
      ensure("owner", "主账号", admin.phone || "");
      employees().forEach(function(emp){ ensure(emp.employee_id, emp.employee_name, emp.phone); });
    }else{
      var a = account();
      ensure(accountEmployeeId(a), a.employee_name || a.name || "员工", a.phone || "");
    }
    rows.forEach(function(order){
      if(order && (order.voided || order.status === "已作废" || order.displayStatus === "已作废")) return;
      var id = order.employee_id || order.employeeId || order.userId || "owner";
      var row = ensure(id, order.employee_name || order.employeeName || order.cashierName || "", order.employee_phone || order.employeePhone || order.cashierPhone || "");
      var total = n(order.totalAmount || order.total || order.amount);
      var paid = n(order.paidAmount || order.paid || (String(order.status || order.displayStatus || "").includes("收银") ? total : 0));
      var debt = n(order.debtAmount || order.debt || Math.max(total - paid, 0));
      var method = String(order.paymentMethod || order.payment || "").toLowerCase();
      row.orderCount += 1;
      row.salesAmount += total;
      row.paidAmount += paid;
      row.debtAmount += debt;
      row.debtMethodAmount += debt;
      if(method === "wechat") row.wechatAmount += paid;
      else if(method === "alipay") row.alipayAmount += paid;
      else if(method === "bank") row.bankAmount += paid;
      else row.cashAmount += paid;
    });
    return Object.keys(map).map(function(key){ return map[key]; });
  };
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  setTimeout(boot, 300);
})();

/* extracted script block 66 */
/* ===== Commercial Sync V1：商用多设备同步架构底座，仅预留不接真实云端 ===== */
(function(){
  var META_KEY = "cangjieCommercialSyncV1";
  var SCHEMA_KEY = "cangjieCloudSchemaV1";
  var PERSIST_KEY = "tudou2_v57_persistent_data";
  var SYNC_CONSOLE_KEY = "cangjieSyncConsoleV1";
  var DEPLOYMENT_CONFIG_KEY = "cangjieDeploymentConfigV1";
  var RLS_PREFLIGHT_KEY = "cangjieRlsPreflightV1";
  const SUPABASE_URL = "https://dsutthgfzyopkzpwawkb.supabase.co";
  const SUPABASE_KEY = "sb_publishable_JKxs11pjPZ2DbQVEi_1A1A_GPaWnn7r";
  let supabaseInitError = "";
  let supabaseClient = null;
  let supabaseClientSignature = "";
  window.CANGJIE_SUPABASE_CONFIG = {
    projectUrl:SUPABASE_URL,
    anonKey:SUPABASE_KEY,
    deploymentMode:"cangjie_cloud",
    databaseSource:"仓颉云 Supabase",
    connected:false,
    lastTestAt:"",
    lastError:""
  };

  function now(){
    return new Date().toISOString();
  }
  function e(v){
    return String(v == null ? "" : v).replace(/[&<>"']/g, function(m){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m];
    });
  }
  function readJson(key, fallback){
    try{
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    }catch(err){
      return fallback;
    }
  }
  function writeJson(key, value){
    localStorage.setItem(key, JSON.stringify(value));
  }
  function defaultDeploymentConfig(){
    return {
      deploymentMode:"cangjie_cloud",
      privateSupabaseUrl:"",
      privateSupabaseKey:"",
      updatedAt:""
    };
  }
  function deploymentModeLabel(mode){
    if(mode === "local_only") return "本地模式";
    if(mode === "private_cloud") return "私有云";
    return "仓颉云";
  }
  function deploymentDatabaseSource(config){
    config = config || deploymentConfig();
    if(config.deploymentMode === "local_only") return "本地 storage.js / localStorage";
    if(config.deploymentMode === "private_cloud") return "客户私有 Supabase";
    return "仓颉云 Supabase";
  }
  function deploymentConfig(){
    var saved = readJson(DEPLOYMENT_CONFIG_KEY, null);
    var next = Object.assign(defaultDeploymentConfig(), saved || {});
    if(["local_only","cangjie_cloud","private_cloud"].indexOf(next.deploymentMode) < 0){
      next.deploymentMode = "cangjie_cloud";
    }
    return next;
  }
  function activeSupabaseSettings(config){
    config = config || deploymentConfig();
    if(config.deploymentMode === "local_only"){
      return {mode:config.deploymentMode, url:"", key:"", source:deploymentDatabaseSource(config)};
    }
    if(config.deploymentMode === "private_cloud"){
      return {
        mode:config.deploymentMode,
        url:String(config.privateSupabaseUrl || "").trim(),
        key:String(config.privateSupabaseKey || "").trim(),
        source:deploymentDatabaseSource(config)
      };
    }
    return {mode:"cangjie_cloud", url:SUPABASE_URL, key:SUPABASE_KEY, source:deploymentDatabaseSource(config)};
  }
  function runtimeSupabaseSettingsFromForm(){
    var checked = document.querySelector('input[name="deploymentModeV1"]:checked');
    var mode = checked ? checked.value : deploymentConfig().deploymentMode;
    if(mode === "private_cloud"){
      return {
        mode:"private_cloud",
        url:String(document.getElementById("privateSupabaseUrlV1")?.value || deploymentConfig().privateSupabaseUrl || "").trim(),
        key:String(document.getElementById("privateSupabaseKeyV1")?.value || deploymentConfig().privateSupabaseKey || "").trim(),
        source:"客户私有 Supabase"
      };
    }
    if(mode === "local_only") return {mode:"local_only", url:"", key:"", source:"本地 storage.js / localStorage"};
    return {mode:"cangjie_cloud", url:SUPABASE_URL, key:SUPABASE_KEY, source:"仓颉云 Supabase"};
  }
  function isLocalOnlyDeployment(){
    return deploymentConfig().deploymentMode === "local_only";
  }
  function updateSupabaseConfigFromDeployment(){
    var config = deploymentConfig();
    var settings = activeSupabaseSettings(config);
    window.CANGJIE_SUPABASE_CONFIG.projectUrl = settings.url || "";
    window.CANGJIE_SUPABASE_CONFIG.anonKey = settings.key || "";
    window.CANGJIE_SUPABASE_CONFIG.deploymentMode = config.deploymentMode;
    window.CANGJIE_SUPABASE_CONFIG.databaseSource = settings.source;
    return settings;
  }
  function resetSupabaseClient(){
    supabaseClient = null;
    supabaseClientSignature = "";
    window.CANGJIE_SUPABASE_CLIENT = null;
    window.cangjieSupabase = null;
  }
  function saveDeploymentConfig(config){
    var next = Object.assign(defaultDeploymentConfig(), config || {});
    if(["local_only","cangjie_cloud","private_cloud"].indexOf(next.deploymentMode) < 0){
      next.deploymentMode = "cangjie_cloud";
    }
    next.privateSupabaseUrl = String(next.privateSupabaseUrl || "").trim();
    next.privateSupabaseKey = String(next.privateSupabaseKey || "").trim();
    next.updatedAt = now();
    writeJson(DEPLOYMENT_CONFIG_KEY, next);
    resetSupabaseClient();
    updateSupabaseConfigFromDeployment();
    var m = meta();
    m.deploymentMode = next.deploymentMode;
    m.databaseSource = deploymentDatabaseSource(next);
    m.syncEnabled = next.deploymentMode !== "local_only";
    if(next.deploymentMode === "local_only"){
      m.autoSyncEnabled = false;
      m.autoSyncMode = "manual";
      m.cloudStatus = "未连接";
    }
    saveMeta(m);
    renderDeploymentConfigV1();
    renderCommercialSyncPanel();
    return next;
  }
  function hashText(text){
    var h = 0;
    text = String(text || "");
    for(var i=0;i<text.length;i++){
      h = ((h << 5) - h) + text.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h).toString(36).padStart(6, "0");
  }
  function merchantProfile(){
    try{
      if(typeof window.getCangjieMerchantProfileV92 === "function") return window.getCangjieMerchantProfileV92();
    }catch(err){}
    return readJson("cangjieMerchantProfileV92", {});
  }
  function getCurrentMerchantId(){
    var saved = readJson(META_KEY, null);
    if(saved && saved.merchantId) return String(saved.merchantId);
    var merchant = merchantProfile();
    return "mch_" + hashText([merchant.name, merchant.phone, merchant.address].join("|"));
  }
  function currentAccount(){
    return readJson("cangjieCurrentAccountV94", null)
      || readJson("cangjieCurrentAccountV93", null)
      || {id:"owner", employee_id:"owner", employee_name:"主账号", role:"owner", name:"主账号", phone:"", authorized:true};
  }
  function isDeveloperMode(){
    try{
      return localStorage.getItem("cangjieDeveloperModeV1") === "true"
        || sessionStorage.getItem("cangjieDeveloperModeV1") === "true";
    }catch(err){
      return false;
    }
  }
  function canShowAdminSyncTools(){
    var account = currentAccount() || {};
    var role = String(account.role || "").trim();
    return isDeveloperMode() && !account.blocked && (role === "owner" || role === "管理员" || role === "admin");
  }
  function ensureDeviceId(){
    var id = "";
    try{ id = localStorage.getItem("cangjie_device_id"); }catch(err){}
    if(!id){
      id = "dev_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2,8);
      try{ localStorage.setItem("cangjie_device_id", id); }catch(err){}
    }
    return id;
  }
  function defaultMeta(){
    var merchant = merchantProfile();
    var account = currentAccount();
    var deployment = deploymentConfig();
    return {
      merchantId:getCurrentMerchantId(),
      userId:account.employee_id || account.employeeId || account.id || (account.role === "owner" ? "owner" : account.phone),
      deviceId:ensureDeviceId(),
      role:account.role || "管理员",
      deploymentMode:deployment.deploymentMode,
      databaseSource:deploymentDatabaseSource(deployment),
      syncVersion:1,
      lastSyncAt:"",
      syncEnabled:deployment.deploymentMode !== "local_only",
      autoSyncEnabled:false,
      autoSyncMode:"manual",
      lastAutoSyncAt:null,
      lastAutoSyncResult:"尚未自动上传",
      lastCloudOrderSyncAt:null,
      lastCloudOrderSyncResult:"尚未同步订单",
      cloudStatus:"未连接",
      dataUpdatedAt:now(),
      cloudUpdatedAt:"",
      offlineAvailable:true,
      conflictLogs:[],
      syncLogs:[]
    };
  }
  function cloudSchema(){
    return {
      merchants:{key:"merchantId", binds:["merchantId"], description:"商户资料"},
      users:{key:"userId", binds:["merchantId","userId"], description:"员工账号"},
      permissions:{key:"permissionId", binds:["merchantId","userId"], description:"员工权限"},
      products:{key:"productId", binds:["merchantId"], description:"商品资料"},
      owners:{key:"ownerId", binds:["merchantId"], description:"货主资料"},
      customers:{key:"customerId", binds:["merchantId"], description:"买家资料"},
      batches:{key:"batchId", binds:["merchantId"], description:"批次"},
      inventory:{key:"inventoryId", binds:["merchantId","batchId","productId"], description:"库存"},
      orders:{key:"orderId", binds:["merchantId","userId","deviceId"], description:"订单"},
      debts:{key:"debtId", binds:["merchantId","customerId"], description:"欠款/还款"},
      printSettings:{key:"printSettingId", binds:["merchantId","deviceId"], description:"打印配置"},
      syncLogs:{key:"syncLogId", binds:["merchantId","deviceId"], description:"同步日志"}
    };
  }
  function meta(){
    var saved = readJson(META_KEY, {});
    var base = defaultMeta();
    var merged = Object.assign({}, base, saved || {});
    var account = currentAccount();
    var deployment = deploymentConfig();
    merged.userId = account.id || merged.userId || "admin";
    merged.role = account.role || merged.role || "管理员";
    merged.deviceId = merged.deviceId || ensureDeviceId();
    merged.deploymentMode = deployment.deploymentMode;
    merged.databaseSource = deploymentDatabaseSource(deployment);
    merged.syncEnabled = deployment.deploymentMode !== "local_only";
    merged.autoSyncEnabled = merged.autoSyncEnabled === true;
    merged.autoSyncMode = merged.autoSyncMode || "manual";
    if(deployment.deploymentMode === "local_only"){
      merged.autoSyncEnabled = false;
      merged.autoSyncMode = "manual";
    }
    if(typeof merged.lastAutoSyncAt === "undefined") merged.lastAutoSyncAt = null;
    merged.lastAutoSyncResult = merged.lastAutoSyncResult || "尚未自动上传";
    if(typeof merged.lastCloudOrderSyncAt === "undefined") merged.lastCloudOrderSyncAt = null;
    merged.lastCloudOrderSyncResult = merged.lastCloudOrderSyncResult || "尚未同步订单";
    return merged;
  }
  function saveMeta(next){
    writeJson(META_KEY, next);
    return next;
  }
  function ensureMeta(){
    var m = meta();
    if(!readJson(SCHEMA_KEY, null)) writeJson(SCHEMA_KEY, cloudSchema());
    saveMeta(m);
    return m;
  }
  function writeSyncLog(type, status, message, extra){
    var m = meta();
    var rows = Array.isArray(m.syncLogs) ? m.syncLogs : [];
    rows.unshift({
      id:"sync_" + Date.now().toString(36),
      time:now(),
      merchantId:getCurrentMerchantId(),
      deviceId:m.deviceId,
      type:type || "info",
      status:status || m.cloudStatus || "未连接",
      message:message || "",
      extra:extra || null
    });
    m.syncLogs = rows.slice(0,50);
    saveMeta(m);
    renderCommercialSyncPanel();
    return m.syncLogs[0];
  }
  function updateSyncStatus(status, patch){
    var m = meta();
    m.cloudStatus = status || m.cloudStatus || "未连接";
    Object.assign(m, patch || {});
    if(status === "同步中" || status === "已连接") m.lastSyncAt = now();
    saveMeta(m);
    renderCommercialSyncPanel();
    return m;
  }
  function setConnectionText(text){
    var el = document.getElementById("commercialSyncConnectionStatusV1");
    if(el) el.textContent = text || "未测试";
  }
  function setInsertText(text){
    var el = document.getElementById("commercialSyncInsertStatusV1");
    if(el) el.textContent = text || "未写入";
  }
  function setSnapshotText(text){
    var el = document.getElementById("commercialSyncSnapshotStatusV1");
    if(el) el.textContent = text || "未同步快照";
  }
  function setAutoSyncText(text){
    var el = document.getElementById("commercialSyncAutoStatusV1");
    if(el) el.textContent = text || "自动同步：关闭";
  }
  function autoSyncModeLabel(mode){
    return mode === "snapshot_upload_only" ? "自动上传快照" : "手动同步";
  }
  function toggleAutoSyncEnabled(checked){
    var m = meta();
    if(!canUseCloudSync({silent:true})) checked = false;
    m.autoSyncEnabled = checked === true;
    m.autoSyncMode = m.autoSyncEnabled ? "snapshot_upload_only" : "manual";
    if(typeof m.lastAutoSyncAt === "undefined") m.lastAutoSyncAt = null;
    m.lastAutoSyncResult = m.lastAutoSyncResult || "尚未自动上传";
    saveMeta(m);
    setAutoSyncText(m.autoSyncEnabled ? "自动同步：开启（仅上传快照）" : "自动同步：关闭");
    renderCommercialSyncPanel();
    writeSyncLog(
      "auto_sync_toggle",
      m.cloudStatus || "未连接",
      m.autoSyncEnabled ? "自动同步已开启：仅允许自动上传业务快照，不会覆盖本地数据。" : "自动同步已关闭：不会执行任何自动同步。"
    );
    return m;
  }
  function ensureDeploymentConfig(){
    if(!readJson(DEPLOYMENT_CONFIG_KEY, null)) writeJson(DEPLOYMENT_CONFIG_KEY, defaultDeploymentConfig());
    updateSupabaseConfigFromDeployment();
    return deploymentConfig();
  }
  function deploymentCloudStatusText(){
    var config = deploymentConfig();
    var settings = activeSupabaseSettings(config);
    if(config.deploymentMode === "local_only") return "本地模式：云同步关闭";
    if(config.deploymentMode === "private_cloud" && (!settings.url || !settings.key)) return "私有云待配置";
    if(window.CANGJIE_SUPABASE_CONFIG.connected) return "已连接";
    if(window.CANGJIE_SUPABASE_CONFIG.lastError) return "未连接：" + window.CANGJIE_SUPABASE_CONFIG.lastError;
    return "未连接";
  }
  function cloudSyncBlockedMessage(settings){
    settings = settings || activeSupabaseSettings();
    if(settings.mode === "local_only") return "当前为本地模式，云同步已关闭。";
    if(settings.mode === "private_cloud" && (!settings.url || !settings.key)) return "请先配置私有云连接。";
    return "";
  }
  function canUseCloudSync(options){
    options = options || {};
    var settings = options.settings || updateSupabaseConfigFromDeployment();
    var message = cloudSyncBlockedMessage(settings);
    window.CANGJIE_LAST_CLOUD_SYNC_BLOCK_MESSAGE = message;
    if(message){
      window.CANGJIE_SUPABASE_CONFIG.connected = false;
      window.CANGJIE_SUPABASE_CONFIG.lastError = message;
      if(!options.silent){
        setConnectionText(message);
        if(typeof toast === "function") toast(message);
      }
      return false;
    }
    return true;
  }
  function cloudSyncBlockedResult(type, statusSetter){
    var message = window.CANGJIE_LAST_CLOUD_SYNC_BLOCK_MESSAGE || cloudSyncBlockedMessage(activeSupabaseSettings());
    if(statusSetter) statusSetter(message);
    writeSyncLog(type || "cloud_sync_blocked", "未连接", message);
    return {data:null, error:message, blocked:true};
  }
  function updateCloudSyncButtonsV1(){
    var allowed = canUseCloudSync({silent:true});
    var message = window.CANGJIE_LAST_CLOUD_SYNC_BLOCK_MESSAGE || "";
    var buttons = Array.from(document.querySelectorAll("#adminSyncToolsV1 button"));
    buttons.forEach(function(btn){
      if(btn && btn.getAttribute("data-local-action-v1") === "1") return;
      btn.disabled = !allowed;
      if(message) btn.title = message;
      else btn.removeAttribute("title");
    });
    var autoInput = document.getElementById("autoSyncEnabledV1");
    if(autoInput){
      autoInput.disabled = !allowed;
      autoInput.title = allowed ? "" : message;
    }
    var testBtn = document.getElementById("testDeploymentSupabaseV1");
    if(testBtn){
      var testAllowed = canUseCloudSync({settings:runtimeSupabaseSettingsFromForm(), silent:true});
      var testMessage = window.CANGJIE_LAST_CLOUD_SYNC_BLOCK_MESSAGE || "";
      testBtn.disabled = !testAllowed;
      testBtn.title = testMessage || "";
    }
  }
  function ensureDeploymentConfigPanelV1(){
    var root = document.getElementById("configStep1Root");
    if(!root) return;
    var menu = root.querySelector(".config-step1-menu");
    if(menu && !document.getElementById("deploymentConfigMenuV1")){
      var menuBtn = document.createElement("button");
      menuBtn.id = "deploymentConfigMenuV1";
      menuBtn.type = "button";
      menuBtn.textContent = "系统部署";
      menuBtn.onclick = function(){ focusDeploymentConfigV1(); };
      menu.appendChild(menuBtn);
    }
    var main = root.querySelector(".config-step1-main") || root.querySelector(".config-fallback-body");
    if(!main || document.getElementById("deploymentConfigPanelV1")) return;
    var title = document.createElement("h2");
    title.id = "deploymentConfigTitleV1";
    title.textContent = "系统部署";
    var section = document.createElement("section");
    section.id = "deploymentConfigPanelV1";
    section.className = "config-step1-card deployment-config-v1";
    section.innerHTML = '<div class="config-step1-row"><div><b>部署模式配置</b><br><span>为 SaaS、私有化和纯本地版本预留。切换模式不会清空数据，也不会覆盖本地订单、库存和员工资料。</span></div><span id="deploymentConfigSaveStatusV1" class="config-step1-status">未修改</span></div>'
      + '<div class="deployment-v1-grid" id="deploymentSummaryV1"></div>'
      + '<div class="deployment-v1-options">'
      + '<label class="deployment-v1-option"><input type="radio" name="deploymentModeV1" value="local_only" onchange="togglePrivateDeploymentFieldsV1()"> 本地模式</label>'
      + '<label class="deployment-v1-option"><input type="radio" name="deploymentModeV1" value="cangjie_cloud" onchange="togglePrivateDeploymentFieldsV1()"> 仓颉云</label>'
      + '<label class="deployment-v1-option"><input type="radio" name="deploymentModeV1" value="private_cloud" onchange="togglePrivateDeploymentFieldsV1()"> 私有云</label>'
      + '</div>'
      + '<div id="privateCloudFieldsV1" class="deployment-v1-private">'
      + '<label>Supabase URL<input id="privateSupabaseUrlV1" placeholder="https://xxxx.supabase.co" oninput="updateCloudSyncButtonsV1()"></label>'
      + '<label>Supabase Key<input id="privateSupabaseKeyV1" placeholder="sb_publishable_..." oninput="updateCloudSyncButtonsV1()"></label>'
      + '<div class="deployment-v1-test-row"><button id="testDeploymentSupabaseV1" class="config-step1-gray" type="button" onclick="testDeploymentSupabaseConnectionV1()">测试连接</button><span id="privateCloudTestStatusV1" class="config-step1-status">未测试</span></div>'
      + '</div>'
      + '<div class="config-step1-actions"><button class="config-step1-green" type="button" onclick="saveDeploymentConfigV1()">保存部署模式</button><button class="config-step1-gray" type="button" onclick="renderDeploymentConfigV1()">刷新状态</button></div>'
      + '<p class="config-step1-note">本地模式会在框架层禁止 Supabase 上传；仓颉云使用当前项目 Supabase；私有云仅保存客户自己的 URL 和 publishable key，后续同步函数会从这里读取。</p>';
    main.appendChild(title);
    main.appendChild(section);
  }
  function setPrivateCloudTestStatusV1(text, cls){
    var el = document.getElementById("privateCloudTestStatusV1");
    if(!el) return;
    el.textContent = text || "未测试";
    el.className = "config-step1-status " + (cls || "");
  }
  function renderDeploymentConfigV1(){
    ensureDeploymentConfig();
    if(!document.getElementById("configStep1Root") && typeof window.ensureConfigStep1Dom === "function"){
      try{ window.ensureConfigStep1Dom(); }catch(err){}
    }
    ensureDeploymentConfigPanelV1();
    var config = deploymentConfig();
    Array.from(document.querySelectorAll('input[name="deploymentModeV1"]')).forEach(function(input){
      input.checked = input.value === config.deploymentMode;
    });
    var url = document.getElementById("privateSupabaseUrlV1");
    var key = document.getElementById("privateSupabaseKeyV1");
    if(url && document.activeElement !== url) url.value = config.privateSupabaseUrl || "";
    if(key && document.activeElement !== key) key.value = config.privateSupabaseKey || "";
    togglePrivateDeploymentFieldsV1();
    var summary = document.getElementById("deploymentSummaryV1");
    if(summary){
      summary.innerHTML = [
        ["当前部署模式", deploymentModeLabel(config.deploymentMode)],
        ["当前连接状态", deploymentCloudStatusText()],
        ["当前数据库来源", deploymentDatabaseSource(config)]
      ].map(function(row){
        return '<div class="deployment-v1-item"><span>'+e(row[0])+'</span><b>'+e(row[1])+'</b></div>';
      }).join("");
    }
    updateCloudSyncButtonsV1();
  }
  function togglePrivateDeploymentFieldsV1(){
    var checked = document.querySelector('input[name="deploymentModeV1"]:checked');
    var mode = checked ? checked.value : deploymentConfig().deploymentMode;
    var box = document.getElementById("privateCloudFieldsV1");
    if(box) box.style.display = mode === "private_cloud" ? "grid" : "none";
    setTimeout(updateCloudSyncButtonsV1, 0);
  }
  function saveDeploymentConfigV1(){
    var checked = document.querySelector('input[name="deploymentModeV1"]:checked');
    var mode = checked ? checked.value : "cangjie_cloud";
    var config = saveDeploymentConfig({
      deploymentMode:mode,
      privateSupabaseUrl:document.getElementById("privateSupabaseUrlV1")?.value || "",
      privateSupabaseKey:document.getElementById("privateSupabaseKeyV1")?.value || ""
    });
    var status = document.getElementById("deploymentConfigSaveStatusV1");
    if(status){
      status.textContent = "已保存：" + deploymentModeLabel(config.deploymentMode);
      status.className = "config-step1-status ok";
    }
    if(typeof toast === "function") toast("部署模式已保存");
    return config;
  }
  function focusDeploymentConfigV1(){
    if(typeof window.renderConfigStep1 === "function") window.renderConfigStep1();
    setTimeout(function(){
      renderDeploymentConfigV1();
      var panel = document.getElementById("deploymentConfigPanelV1");
      if(panel && panel.scrollIntoView) panel.scrollIntoView({block:"start", behavior:"smooth"});
    }, 0);
  }
  function installDeploymentConfigRenderHook(){
    if(typeof window.renderConfigStep1 !== "function" || window.renderConfigStep1.__deploymentConfigV1) return;
    var old = window.renderConfigStep1;
    window.renderConfigStep1 = function(){
      var result = old.apply(this, arguments);
      setTimeout(renderDeploymentConfigV1, 0);
      return result;
    };
    window.renderConfigStep1.__deploymentConfigV1 = true;
  }
  function createRuntimeSupabaseClient(options){
    var settings = options && options.settings ? options.settings : updateSupabaseConfigFromDeployment();
    window.CANGJIE_SUPABASE_CONFIG.projectUrl = settings.url || "";
    window.CANGJIE_SUPABASE_CONFIG.anonKey = settings.key || "";
    window.CANGJIE_SUPABASE_CONFIG.deploymentMode = settings.mode || deploymentConfig().deploymentMode;
    window.CANGJIE_SUPABASE_CONFIG.databaseSource = settings.source || deploymentDatabaseSource();
    if(!canUseCloudSync({settings:settings, silent:options && options.silent})) return null;
    if(!window.supabase || typeof window.supabase.createClient !== "function"){
      supabaseInitError = "Supabase SDK 未加载";
      window.CANGJIE_SUPABASE_CONFIG.lastError = supabaseInitError;
      setConnectionText("SDK 未加载");
      return null;
    }
    if(!settings.url || !settings.key){
      supabaseInitError = settings.mode === "private_cloud" ? "私有云 Supabase URL/Key 未填写" : "Supabase URL/Key 未配置";
      window.CANGJIE_SUPABASE_CONFIG.lastError = supabaseInitError;
      setConnectionText("初始化失败");
      return null;
    }
    if(settings.key.indexOf("sb_publishable_") !== 0){
      supabaseInitError = "Supabase publishable key 无效";
      window.CANGJIE_SUPABASE_CONFIG.lastError = supabaseInitError;
      setConnectionText("初始化失败");
      return null;
    }
    var signature = settings.mode + "|" + settings.url + "|" + settings.key;
    if(supabaseClient && supabaseClientSignature === signature) return supabaseClient;
    try{
      supabaseClient = window.supabase.createClient(settings.url, settings.key);
      supabaseClientSignature = signature;
      supabaseInitError = "";
      window.CANGJIE_SUPABASE_CLIENT = supabaseClient;
      window.cangjieSupabase = supabaseClient;
      window.CANGJIE_SUPABASE_CONFIG.lastError = "";
      console.log("当前 Supabase URL:", settings.url);
      console.log("Supabase初始化成功", supabaseClient);
      return supabaseClient;
    }catch(err){
      supabaseInitError = err && err.message ? err.message : String(err);
      window.CANGJIE_SUPABASE_CONFIG.lastError = supabaseInitError;
      setConnectionText("初始化失败");
      return null;
    }
  }
  function initSupabaseClient(){
    return createRuntimeSupabaseClient();
  }
  async function testDeploymentSupabaseConnectionV1(){
    var settings = runtimeSupabaseSettingsFromForm();
    if(!canUseCloudSync({settings:settings})){
      setPrivateCloudTestStatusV1(window.CANGJIE_LAST_CLOUD_SYNC_BLOCK_MESSAGE || "云同步不可用", "warn");
      return {data:null, error:window.CANGJIE_LAST_CLOUD_SYNC_BLOCK_MESSAGE, blocked:true};
    }
    setPrivateCloudTestStatusV1("测试中...", "warn");
    var client = createRuntimeSupabaseClient({settings:settings});
    if(!client){
      var initError = window.CANGJIE_SUPABASE_CONFIG.lastError || "Supabase 未初始化";
      setPrivateCloudTestStatusV1("连接失败：" + initError, "bad");
      renderDeploymentConfigV1();
      return {data:null, error:initError};
    }
    try{
      var result = await client.from("test_orders").select("id").limit(1);
      var source = "test_orders";
      if(result.error){
        result = await client.from("cloud_snapshots").select("id").eq("merchant_id", getCurrentMerchantId()).limit(1);
        source = "cloud_snapshots";
      }
      if(result.error){
        var message = result.error.message || String(result.error);
        window.CANGJIE_SUPABASE_CONFIG.connected = false;
        window.CANGJIE_SUPABASE_CONFIG.lastError = message;
        setPrivateCloudTestStatusV1("连接失败：" + message, "bad");
        updateSyncStatus("同步失败");
        renderDeploymentConfigV1();
        return {data:result.data, error:result.error};
      }
      window.CANGJIE_SUPABASE_CONFIG.connected = true;
      window.CANGJIE_SUPABASE_CONFIG.lastError = "";
      window.CANGJIE_SUPABASE_CONFIG.lastTestAt = now();
      updateSyncStatus("已连接", {lastSyncAt:window.CANGJIE_SUPABASE_CONFIG.lastTestAt});
      setPrivateCloudTestStatusV1("连接成功：" + source, "ok");
      renderDeploymentConfigV1();
      return {data:result.data, error:null, source:source};
    }catch(err){
      var errText = err && err.message ? err.message : String(err);
      window.CANGJIE_SUPABASE_CONFIG.connected = false;
      window.CANGJIE_SUPABASE_CONFIG.lastError = errText;
      setPrivateCloudTestStatusV1("连接失败：" + errText, "bad");
      updateSyncStatus("同步失败");
      renderDeploymentConfigV1();
      return {data:null, error:err};
    }
  }
  async function testConnection(){
    if(!canUseCloudSync()) return cloudSyncBlockedResult("supabase_test", setConnectionText);
    var client = initSupabaseClient();
    if(!client){
      console.log("连接测试:", null, window.CANGJIE_SUPABASE_CONFIG.lastError || "Supabase 未初始化");
      updateSyncStatus("同步失败");
      writeSyncLog("supabase_test", "同步失败", "Supabase SDK 未加载或初始化失败。");
      return {data:null, error:window.CANGJIE_SUPABASE_CONFIG.lastError || "Supabase 未初始化"};
    }
    setConnectionText("同步中...");
    updateSyncStatus("同步中");
    try{
      var result = await client
        .from("test_connection")
        .select("*")
        .limit(1);
      console.log("连接测试:", result.data, result.error);
      window.CANGJIE_SUPABASE_CONFIG.lastTestAt = now();
      if(result.error){
        window.CANGJIE_SUPABASE_CONFIG.connected = false;
        window.CANGJIE_SUPABASE_CONFIG.lastError = result.error.message || String(result.error);
        updateSyncStatus("同步失败");
        setConnectionText("连接失败：" + window.CANGJIE_SUPABASE_CONFIG.lastError);
        writeSyncLog("supabase_test", "同步失败", "Supabase 连接测试失败。", {error:window.CANGJIE_SUPABASE_CONFIG.lastError});
      }else{
        window.CANGJIE_SUPABASE_CONFIG.connected = true;
        window.CANGJIE_SUPABASE_CONFIG.lastError = "";
        updateSyncStatus("已连接", {lastSyncAt:window.CANGJIE_SUPABASE_CONFIG.lastTestAt});
        setConnectionText("已连接");
        writeSyncLog("supabase_test", "已连接", "Supabase 连接测试成功。");
      }
      return result;
    }catch(err){
      var message = err && err.message ? err.message : String(err);
      console.log("连接测试:", null, err);
      window.CANGJIE_SUPABASE_CONFIG.connected = false;
      window.CANGJIE_SUPABASE_CONFIG.lastError = message;
      updateSyncStatus("同步失败");
      setConnectionText("连接失败：" + message);
      writeSyncLog("supabase_test", "同步失败", "Supabase 连接测试异常。", {error:message});
      return {data:null, error:err};
    }
  }
  async function testInsert(){
    console.log("开始写入测试");
    if(!canUseCloudSync()) return cloudSyncBlockedResult("supabase_insert", setInsertText);
    var client = initSupabaseClient();
    if(!client){
      console.log("写入结果:", null, window.CANGJIE_SUPABASE_CONFIG.lastError || "Supabase 未初始化");
      setInsertText("写入失败：Supabase 未初始化");
      writeSyncLog("supabase_insert", "同步失败", "Supabase 未初始化，测试写入未执行。");
      return {data:null, error:window.CANGJIE_SUPABASE_CONFIG.lastError || "Supabase 未初始化"};
    }
    setInsertText("写入中...");
    updateSyncStatus("同步中");
    try{
      var result = await client
        .from("test_orders")
        .insert([
          {content:"测试订单-" + Date.now()}
        ])
        .select();
      console.log("写入结果:", result.data, result.error);
      if(result.error){
        var message = result.error.message || String(result.error);
        setInsertText("写入失败：" + message);
        updateSyncStatus("同步失败");
        writeSyncLog("supabase_insert", "同步失败", "Supabase 测试写入失败。", {error:message});
      }else{
        setInsertText("写入成功：" + ((result.data && result.data[0] && result.data[0].id) || "已生成记录"));
        updateSyncStatus("已连接", {lastSyncAt:now()});
        writeSyncLog("supabase_insert", "已连接", "Supabase 测试订单写入成功。", {rows:result.data || []});
      }
      return result;
    }catch(err){
      var errText = err && err.message ? err.message : String(err);
      console.log("写入结果:", null, err);
      setInsertText("写入失败：" + errText);
      updateSyncStatus("同步失败");
      writeSyncLog("supabase_insert", "同步失败", "Supabase 测试写入异常。", {error:errText});
      return {data:null, error:err};
    }
  }
  async function testReadCloud(){
    console.log("开始读取云端数据");
    if(!canUseCloudSync()){
      var blockedReadEl = document.getElementById("commercialSyncReadStatusV1");
      return cloudSyncBlockedResult("supabase_read", function(text){ if(blockedReadEl) blockedReadEl.textContent = text; });
    }
    var client = initSupabaseClient();
    if(!client){
      var initError = window.CANGJIE_SUPABASE_CONFIG.lastError || "Supabase 未初始化";
      console.log("读取结果:", null, initError);
      var initEl = document.getElementById("commercialSyncReadStatusV1");
      if(initEl) initEl.textContent = "读取失败：" + initError;
      writeSyncLog("supabase_read", "同步失败", "Supabase 未初始化，测试读取未执行。");
      return {data:null, error:initError};
    }
    var el = document.getElementById("commercialSyncReadStatusV1");
    if(el) el.textContent = "读取中...";
    try{
      var result = await client
        .from("test_orders")
        .select("*")
        .order("created_at", {ascending:false})
        .limit(10);
      console.log("读取结果:", result.data, result.error);
      if(el){
        el.textContent = result.error
          ? "读取失败：" + result.error.message
          : "读取成功：" + ((result.data || []).length) + " 条";
      }
      if(result.error){
        updateSyncStatus("同步失败");
        writeSyncLog("supabase_read", "同步失败", "Supabase 测试读取失败。", {error:result.error.message || String(result.error)});
      }else{
        updateSyncStatus("已连接", {lastSyncAt:now()});
        writeSyncLog("supabase_read", "已连接", "Supabase 测试读取成功。", {count:(result.data || []).length});
      }
      return {data:result.data, error:result.error};
    }catch(err){
      var message = err && err.message ? err.message : String(err);
      console.log("读取结果:", null, err);
      if(el) el.textContent = "读取失败：" + message;
      updateSyncStatus("同步失败");
      writeSyncLog("supabase_read", "同步失败", "Supabase 测试读取异常。", {error:message});
      return {data:null, error:err};
    }
  }
  function markDataUpdated(){
    var m = meta();
    m.dataUpdatedAt = now();
    m.syncVersion = Number(m.syncVersion || 1) + 1;
    saveMeta(m);
    renderCommercialSyncPanel();
    return m;
  }
  function orderAutoSyncFingerprint(){
    try{
      var data = persistentData();
      var orders = [];
      if(typeof finalOrders !== "undefined" && Array.isArray(finalOrders)) orders = finalOrders;
      else if(Array.isArray(data.finalOrders)) orders = data.finalOrders;
      return JSON.stringify((orders || []).map(function(o){
        return [
          o && (o.orderNo || o.billNo || o.id || ""),
          o && (o.status || o.displayStatus || ""),
          o && (o.totalAmount || o.amount || 0),
          o && (o.time || o.createdAt || ""),
          o && (o.updatedAt || o.savedAt || o.cloudUpdatedAt || "")
        ].join("|");
      }));
    }catch(err){
      return "";
    }
  }
  function setAutoUploadResult(resultText, atText){
    var m = meta();
    m.lastAutoSyncAt = atText || now();
    m.lastAutoSyncResult = resultText || "尚未自动上传";
    saveMeta(m);
    setAutoSyncText(m.autoSyncEnabled ? "自动同步：开启（仅上传快照）" : "自动同步：关闭");
    renderCommercialSyncPanel();
    return m;
  }
  function autoUploadBusinessSnapshotAfterOrder(reason){
    var m = meta();
    if(m.autoSyncEnabled !== true) return Promise.resolve({skipped:true, reason:"auto_sync_off"});
    if(!canUseCloudSync({silent:true})){
      var blockMessage = window.CANGJIE_LAST_CLOUD_SYNC_BLOCK_MESSAGE || "云同步不可用";
      setAutoUploadResult(blockMessage, now());
      writeSyncLog("auto_snapshot_push", "未连接", blockMessage, {reason:reason || "order_completed"});
      return Promise.resolve({skipped:true, reason:"cloud_sync_blocked"});
    }
    m.autoSyncMode = "snapshot_upload_only";
    saveMeta(m);
    setAutoUploadResult("自动上传中...", now());
    return Promise.resolve()
      .then(function(){ return pushBusinessSnapshot(); })
      .then(function(result){
        var hasError = result && result.error;
        if(hasError){
          var msg = result.error && result.error.message ? result.error.message : String(result.error);
          setAutoUploadResult("云端同步失败，本地已保存", now());
          if(typeof toast === "function") toast("云端同步失败，本地已保存");
          writeSyncLog("auto_snapshot_push", "同步失败", "订单已本地保存；自动上传业务快照失败。", {reason:reason || "order_completed", error:msg});
        }else{
          var row = result && result.data && result.data[0];
          setAutoUploadResult("自动上传成功" + (row && row.id ? "：" + row.id : ""), now());
          writeSyncLog("auto_snapshot_push", "已连接", "订单完成后已自动上传业务快照。", {reason:reason || "order_completed", snapshotId:row && row.id});
        }
        return result;
      })
      .catch(function(err){
        var msg = err && err.message ? err.message : String(err);
        setAutoUploadResult("云端同步失败，本地已保存", now());
        if(typeof toast === "function") toast("云端同步失败，本地已保存");
        writeSyncLog("auto_snapshot_push", "同步失败", "订单已本地保存；自动上传业务快照异常。", {reason:reason || "order_completed", error:msg});
        console.log("自动上传业务快照失败，本地已保存:", err);
        return {data:null, error:err};
      });
  }
  function completedOrdersForCloud(){
    var data = persistentData();
    var orders = [];
    if(typeof finalOrders !== "undefined" && Array.isArray(finalOrders)) orders = finalOrders;
    else if(Array.isArray(data.finalOrders)) orders = data.finalOrders;
    return (orders || []).filter(function(order){
      if(!order || typeof order !== "object") return false;
      var status = String(order.status || order.displayStatus || "");
      return status !== "待处理" && status !== "待处理订单" && status !== "码单" && status !== "已开码单";
    });
  }
  function cloudOrderKey(order){
    if(!order) return "";
    return String(order.orderNo || order.billNo || order.id || "").trim();
  }
  function cloudOrderKeySet(){
    var map = {};
    completedOrdersForCloud().forEach(function(order){
      var key = cloudOrderKey(order);
      if(key) map[key] = true;
    });
    return map;
  }
  function cloudOrderSyncLedger(){
    return readJson("cangjieCloudOrderSyncLedgerV1", {});
  }
  function saveCloudOrderSyncLedger(ledger){
    writeJson("cangjieCloudOrderSyncLedgerV1", ledger || {});
  }
  function setCloudOrderSyncResult(resultText, atText){
    var m = meta();
    m.lastCloudOrderSyncAt = atText || now();
    m.lastCloudOrderSyncResult = resultText || "尚未同步订单";
    saveMeta(m);
    renderCommercialSyncPanel();
    return m;
  }
  function publicOrdersTable(client){
    return (client && typeof client.schema === "function")
      ? client.schema("public").from("orders")
      : client.from("orders");
  }
  function publicInventoryTable(client){
    return (client && typeof client.schema === "function")
      ? client.schema("public").from("inventory")
      : client.from("inventory");
  }
  function publicEmployeesTable(client){
    return (client && typeof client.schema === "function")
      ? client.schema("public").from("employees")
      : client.from("employees");
  }
  function uniqueStrings(list){
    var map = {};
    return (list || []).map(function(v){ return String(v || "").trim(); }).filter(function(v){
      if(!v || map[v]) return false;
      map[v] = true;
      return true;
    });
  }
  function syncConsoleMerchantIds(){
    return uniqueStrings([getCurrentMerchantId()]);
  }
  function blankSyncConsoleModule(label, uploadAt, result){
    return {
      label:label,
      lastUploadAt:uploadAt || "",
      lastReadAt:"",
      lastResult:result || "尚未检查",
      cloudCount:"-",
      healthStatus:"未检测",
      lastHealthCheckAt:"",
      hasError:false,
      error:""
    };
  }
  function defaultSyncConsoleState(){
    var m = meta();
    return {
      updatedAt:"",
      overallHealthStatus:"未检测",
      lastHealthCheckAt:"",
      lastHealthSummary:"尚未进行同步健康检查",
      modules:{
        orders:blankSyncConsoleModule("订单同步", m.lastCloudOrderSyncAt || "", m.lastCloudOrderSyncResult || "尚未检查订单"),
        inventory:blankSyncConsoleModule("库存同步", "", "尚未检查库存"),
        employees:blankSyncConsoleModule("员工同步", "", "尚未检查员工"),
        snapshots:blankSyncConsoleModule("云端快照", m.cloudUpdatedAt || "", "尚未检查快照")
      }
    };
  }
  function syncConsoleState(){
    var base = defaultSyncConsoleState();
    var saved = readJson(SYNC_CONSOLE_KEY, {});
    var next = Object.assign({}, base, saved || {});
    next.modules = Object.assign({}, base.modules, (saved && saved.modules) || {});
    Object.keys(base.modules).forEach(function(key){
      next.modules[key] = Object.assign({}, base.modules[key], next.modules[key] || {});
    });
    return next;
  }
  function saveSyncConsoleState(next){
    writeJson(SYNC_CONSOLE_KEY, next);
    return next;
  }
  function setSyncConsoleModule(key, patch){
    var state = syncConsoleState();
    if(!state.modules[key]) state.modules[key] = blankSyncConsoleModule(key, "", "");
    state.modules[key] = Object.assign({}, state.modules[key], patch || {});
    state.updatedAt = now();
    saveSyncConsoleState(state);
    renderSyncConsolePanel();
    return state.modules[key];
  }
  function healthClass(status){
    if(status === "正常") return "normal";
    if(status === "警告") return "warning";
    if(status === "异常") return "error";
    return "pending";
  }
  function healthBadge(status){
    status = status || "未检测";
    return '<span class="sync-console-v1-health '+healthClass(status)+'">'+e(status)+'</span>';
  }
  function healthStatusFromResult(result, count){
    if(result && result.error) return "异常";
    if(Number(count || 0) <= 0) return "警告";
    return "正常";
  }
  function computeOverallHealth(state){
    state = state || syncConsoleState();
    var keys = ["orders","inventory","employees","snapshots"];
    var statuses = keys.map(function(key){ return (state.modules[key] && state.modules[key].healthStatus) || "未检测"; });
    if(statuses.some(function(status){ return status === "异常"; })) return "异常";
    if(statuses.some(function(status){ return status === "警告"; })) return "警告";
    if(statuses.every(function(status){ return status === "正常"; })) return "正常";
    return "未检测";
  }
  function setOverallHealth(status, summary, at){
    var state = syncConsoleState();
    state.overallHealthStatus = status || computeOverallHealth(state);
    state.lastHealthCheckAt = at || now();
    state.lastHealthSummary = summary || "";
    state.updatedAt = now();
    saveSyncConsoleState(state);
    setSyncConsoleGlobalStatus("总体同步状态：" + state.overallHealthStatus);
    renderSyncConsolePanel();
    return state;
  }
  function syncConsoleConfigs(){
    return {
      orders:{label:"订单同步", latestField:"cloud_created_at", table:publicOrdersTable},
      inventory:{label:"库存同步", latestField:"cloud_updated_at", table:publicInventoryTable},
      employees:{label:"员工同步", latestField:"cloud_updated_at", table:publicEmployeesTable},
      snapshots:{label:"云端快照", latestField:"cloud_updated_at", table:function(client){ return client.from("cloud_snapshots"); }, snapshot:true}
    };
  }
  function applySyncConsoleFilters(query, key){
      query = query.eq("merchant_id", getCurrentMerchantId());
      if(key === "snapshots") query = query.eq("data_type", "full_snapshot");
      return query;
  }
  function syncConsoleLatestTime(row, field){
    return (row && (row[field] || row.cloud_updated_at || row.cloud_created_at || row.local_updated_at || row.local_created_at)) || "";
  }
  async function checkSyncConsoleModule(key){
    var cfg = syncConsoleConfigs()[key];
    if(!cfg) return {key:key, error:"未知模块"};
    if(!canUseCloudSync()){
      var blockedMessage = window.CANGJIE_LAST_CLOUD_SYNC_BLOCK_MESSAGE || "云同步不可用";
      setSyncConsoleModule(key, {lastReadAt:now(), lastHealthCheckAt:now(), healthStatus:"异常", lastResult:blockedMessage, hasError:true, error:blockedMessage});
      return {key:key, data:null, error:blockedMessage, blocked:true};
    }
    var client = initSupabaseClient();
    if(!client){
      var initError = window.CANGJIE_SUPABASE_CONFIG.lastError || "Supabase 未初始化";
      setSyncConsoleModule(key, {lastReadAt:now(), lastHealthCheckAt:now(), healthStatus:"异常", lastResult:"检查失败：" + initError, hasError:true, error:initError});
      return {key:key, data:null, error:initError};
    }
    setSyncConsoleModule(key, {lastResult:"检查中...", hasError:false, error:""});
    try{
      var countQuery = applySyncConsoleFilters(cfg.table(client).select("id", {count:"exact", head:true}), key);
      var countResult = await countQuery;
      if(countResult.error) throw countResult.error;
      var latestQuery = applySyncConsoleFilters(cfg.table(client).select("*"), key)
        .order(cfg.latestField, {ascending:false})
        .limit(1);
      var latestResult = await latestQuery;
      if(latestResult.error) throw latestResult.error;
      var row = (latestResult.data || [])[0] || null;
      var count = typeof countResult.count === "number" ? countResult.count : ((latestResult.data || []).length || 0);
      var latestAt = syncConsoleLatestTime(row, cfg.latestField);
      var health = healthStatusFromResult(null, count);
      var module = setSyncConsoleModule(key, {
        label:cfg.label,
        lastUploadAt:latestAt || syncConsoleState().modules[key].lastUploadAt || "",
        lastReadAt:now(),
        lastHealthCheckAt:now(),
        healthStatus:health,
        lastResult:health === "警告" ? "同步警告：云端暂无记录" : "检查成功：" + count + " 条云端记录",
        cloudCount:count,
        hasError:false,
        error:""
      });
      updateSyncStatus("已连接", {lastSyncAt:module.lastReadAt});
      return {key:key, data:{count:count, latest:row}, error:null};
    }catch(err){
      var message = err && err.message ? err.message : String(err);
      setSyncConsoleModule(key, {lastReadAt:now(), lastHealthCheckAt:now(), healthStatus:"异常", lastResult:"检查失败：" + message, hasError:true, error:message});
      updateSyncStatus("同步失败");
      return {key:key, data:null, error:err};
    }
  }
  async function checkOrderSyncConsole(){ return checkSyncConsoleModule("orders"); }
  async function checkInventorySyncConsole(){ return checkSyncConsoleModule("inventory"); }
  async function checkEmployeeSyncConsole(){ return checkSyncConsoleModule("employees"); }
  async function checkSnapshotSyncConsole(){ return checkSyncConsoleModule("snapshots"); }
  async function checkAllSyncConsole(){
    setSyncConsoleGlobalStatus("一键检查中...");
    var result = await Promise.all([
      checkOrderSyncConsole(),
      checkInventorySyncConsole(),
      checkEmployeeSyncConsole(),
      checkSnapshotSyncConsole()
    ]);
    var errors = result.filter(function(row){ return row && row.error; }).length;
    setSyncConsoleGlobalStatus(errors ? "检查完成：" + errors + " 个模块有错误" : "检查完成：全部正常");
    return result;
  }
  async function runSyncHealthCheck(){
    setSyncConsoleGlobalStatus("同步健康检查中...");
    var checkedAt = now();
    var result = await Promise.all([
      checkOrderSyncConsole(),
      checkInventorySyncConsole(),
      checkEmployeeSyncConsole(),
      checkSnapshotSyncConsole()
    ]);
    var state = syncConsoleState();
    var overall = computeOverallHealth(state);
    var warnings = Object.keys(state.modules || {}).filter(function(key){
      return state.modules[key] && state.modules[key].healthStatus === "警告";
    }).length;
    var errors = Object.keys(state.modules || {}).filter(function(key){
      return state.modules[key] && state.modules[key].healthStatus === "异常";
    }).length;
    var summary = overall === "正常"
      ? "全部模块请求成功且云端已有数据"
      : (overall === "异常" ? "发现 " + errors + " 个异常模块" : "发现 " + warnings + " 个警告模块");
    setOverallHealth(overall, summary, checkedAt);
    return {overall:overall, summary:summary, result:result};
  }
  function clearSyncConsoleErrors(){
    var state = syncConsoleState();
    Object.keys(state.modules || {}).forEach(function(key){
      state.modules[key].hasError = false;
      state.modules[key].error = "";
      if(state.modules[key].healthStatus === "异常") state.modules[key].healthStatus = "未检测";
      if(String(state.modules[key].lastResult || "").indexOf("检查失败：") === 0) state.modules[key].lastResult = "错误提示已清除";
    });
    state.overallHealthStatus = computeOverallHealth(state);
    state.lastHealthSummary = "错误提示已清除";
    state.updatedAt = now();
    saveSyncConsoleState(state);
    setSyncConsoleGlobalStatus("错误提示已清除");
    renderSyncConsolePanel();
    return state;
  }
  function rlsPreflightConfigs(){
    return {
      orders:{label:"orders", table:publicOrdersTable, readMerchantScoped:true, writeMerchantScoped:true, latestField:"cloud_created_at"},
      inventory:{label:"inventory", table:publicInventoryTable, readMerchantScoped:true, writeMerchantScoped:true, latestField:"cloud_updated_at"},
      employees:{label:"employees", table:publicEmployeesTable, readMerchantScoped:true, writeMerchantScoped:true, latestField:"cloud_updated_at"},
      cloud_snapshots:{label:"cloud_snapshots", table:function(client){ return client.from("cloud_snapshots"); }, readMerchantScoped:true, writeMerchantScoped:true, latestField:"cloud_updated_at", snapshot:true}
    };
  }
  function defaultRlsPreflightState(){
    var modules = {};
    Object.keys(rlsPreflightConfigs()).forEach(function(key){
      modules[key] = {
        label:rlsPreflightConfigs()[key].label,
        readMerchantScoped:null,
        writeMerchantScoped:null,
        queryMerchantScoped:null,
        status:"未检测",
        result:"尚未预检",
        count:"-",
        error:""
      };
    });
    return {
      updatedAt:"",
      merchantId:getCurrentMerchantId(),
      overallStatus:"未检测",
      canEnterRls:false,
      summary:"尚未进行 RLS 商用安全预检",
      modules:modules
    };
  }
  function rlsPreflightState(){
    var base = defaultRlsPreflightState();
    var saved = readJson(RLS_PREFLIGHT_KEY, {});
    var next = Object.assign({}, base, saved || {});
    next.merchantId = getCurrentMerchantId();
    next.modules = Object.assign({}, base.modules, (saved && saved.modules) || {});
    Object.keys(base.modules).forEach(function(key){
      next.modules[key] = Object.assign({}, base.modules[key], next.modules[key] || {});
    });
    return next;
  }
  function saveRlsPreflightState(next){
    writeJson(RLS_PREFLIGHT_KEY, next);
    return next;
  }
  function setRlsPreflightStatus(text){
    var value = text || "未检测";
    var el = document.getElementById("rlsPreflightStatusV1");
    if(el) el.textContent = value;
    var adminEl = document.getElementById("rlsPreflightStatusAdminV1");
    if(adminEl) adminEl.textContent = value;
  }
  function ensureRlsPreflightPanel(){
    var root = document.getElementById("profileCenterRootV92");
    var grid = root && root.querySelector(".profile-v92-grid");
    if(!grid || document.getElementById("rlsPreflightPanelV1")) return;
    var card = document.createElement("div");
    card.id = "rlsPreflightPanelV1";
    card.className = "profile-v92-card commercial-sync-v1-card";
    card.innerHTML = '<div class="sync-console-v1-head"><div><h2>RLS 商用安全预检</h2><p>检查订单、库存、员工和业务快照读写是否统一绑定当前商户 ID；本阶段不启用 RLS。</p></div><span id="rlsPreflightStatusV1" class="commercial-sync-v1-status">未检测</span></div>'
      + '<div id="rlsPreflightIdentityV1" class="commercial-sync-v1-grid" style="margin-top:12px"></div>'
      + '<div class="sync-console-v1-table-wrap" style="margin-top:12px"><table class="sync-console-v1-table"><thead><tr><th>云端表</th><th>读取是否带 merchant_id</th><th>写入是否带 merchant_id</th><th>只读查询验证</th><th>云端记录数</th><th>状态</th><th>说明</th></tr></thead><tbody id="rlsPreflightBodyV1"></tbody></table></div>'
      + '<div class="commercial-sync-v1-note">RLS 预检只执行带 merchant_id 的只读查询；不会开启 RLS、不会新增/删除/覆盖任何云端或本地数据。</div>';
    var after = document.getElementById("syncConsolePanelV1");
    if(after && after.parentNode === grid) grid.insertBefore(card, after.nextSibling);
    else grid.appendChild(card);
  }
  function renderRlsPreflightPanel(){
    ensureRlsPreflightPanel();
    var panel = document.getElementById("rlsPreflightPanelV1");
    if(panel) panel.style.display = canShowAdminSyncTools() ? "" : "none";
    if(!canShowAdminSyncTools()) return;
    var state = rlsPreflightState();
    var identity = document.getElementById("rlsPreflightIdentityV1");
    var body = document.getElementById("rlsPreflightBodyV1");
    if(!identity || !body) return;
    function scopedText(value){
      if(value === true) return "是";
      if(value === false) return "否";
      return "未检测";
    }
    setRlsPreflightStatus("总体状态：" + (state.overallStatus || "未检测"));
    identity.innerHTML = [
      ["当前商户ID", state.merchantId || ""],
      ["总体状态", healthBadge(state.overallStatus || "未检测")],
      ["最近预检时间", state.updatedAt || "尚未预检"],
      ["是否可以进入 RLS 阶段", state.canEnterRls ? "可以" : "暂不可以"],
      ["说明", state.summary || "尚未进行 RLS 商用安全预检"]
    ].map(function(row){
      var value = String(row[1] || "-");
      return '<div class="commercial-sync-v1-item"><span>'+e(row[0])+'</span><b>'+(value.indexOf("sync-console-v1-health") >= 0 ? value : e(value))+'</b></div>';
    }).join("");
    body.innerHTML = Object.keys(rlsPreflightConfigs()).map(function(key){
      var row = state.modules[key] || {};
      return '<tr><td>'+e(row.label || key)+'</td>'
        + '<td>'+e(scopedText(row.readMerchantScoped))+'</td>'
        + '<td>'+e(scopedText(row.writeMerchantScoped))+'</td>'
        + '<td>'+e(row.queryMerchantScoped === true ? "通过" : (row.queryMerchantScoped === false ? "未通过" : "未检测"))+'</td>'
        + '<td>'+e(row.count == null ? "-" : row.count)+'</td>'
        + '<td>'+healthBadge(row.status || "未检测")+'</td>'
        + '<td class="'+(row.error ? "sync-console-v1-error" : "sync-console-v1-ok")+'">'+e(row.error || row.result || "未检测")+'</td></tr>';
    }).join("");
  }
  async function runRlsCommercialPrecheck(){
    setRlsPreflightStatus("RLS 预检中...");
    var state = rlsPreflightState();
    var checkedAt = now();
    state.updatedAt = checkedAt;
    state.merchantId = getCurrentMerchantId();
    var client = null;
    if(canUseCloudSync({silent:true})) client = initSupabaseClient();
    var configs = rlsPreflightConfigs();
    var allOk = true;
    var blocked = window.CANGJIE_LAST_CLOUD_SYNC_BLOCK_MESSAGE || "";
    if(!client){
      allOk = false;
      blocked = blocked || window.CANGJIE_SUPABASE_CONFIG.lastError || "Supabase 未初始化";
    }
    for(var key in configs){
      var cfg = configs[key];
      var module = {
        label:cfg.label,
        readMerchantScoped:cfg.readMerchantScoped === true,
        writeMerchantScoped:cfg.writeMerchantScoped === true,
        queryMerchantScoped:false,
        status:"未检测",
        result:"",
        count:"-",
        error:""
      };
      if(!client){
        module.status = "异常";
        module.error = blocked;
        state.modules[key] = module;
        continue;
      }
      try{
        var query = cfg.table(client)
          .select("id, merchant_id", {count:"exact"})
          .eq("merchant_id", state.merchantId);
        if(cfg.snapshot) query = query.eq("data_type", "full_snapshot");
        var result = await query.limit(1);
        if(result.error) throw result.error;
        module.queryMerchantScoped = true;
        module.count = typeof result.count === "number" ? result.count : ((result.data || []).length || 0);
        module.status = (module.readMerchantScoped && module.writeMerchantScoped) ? "正常" : "异常";
        module.result = "已使用 merchant_id=" + state.merchantId + " 完成只读验证";
      }catch(err){
        module.status = "异常";
        module.error = err && err.message ? err.message : String(err);
      }
      if(module.status !== "正常") allOk = false;
      state.modules[key] = module;
    }
    state.canEnterRls = allOk;
    state.overallStatus = allOk ? "正常" : "异常";
    state.summary = allOk
      ? "所有正式云端读写均已绑定 merchant_id，可进入 RLS 设计阶段，但本次未开启 RLS。"
      : "仍有模块未通过 merchant_id 预检，暂不进入 RLS 阶段。";
    saveRlsPreflightState(state);
    setRlsPreflightStatus(allOk ? "RLS 预检通过" : "RLS 预检未通过");
    renderRlsPreflightPanel();
    writeSyncLog("rls_preflight", allOk ? "已连接" : "同步失败", state.summary, {merchantId:state.merchantId, modules:state.modules});
    return state;
  }
  function rlsPolicyDraftSql(){
    var tables = ["orders", "inventory", "employees", "cloud_snapshots"];
    var claim = "nullif(auth.jwt() ->> 'merchant_id', '')";
    var lines = [
      "-- RLS strategy draft only. Do not run in production until merchant_id JWT claims are issued and verified.",
      "-- This draft is generated for review; the current page does not execute any SQL.",
      ""
    ];
    tables.forEach(function(table){
      lines.push("-- " + table + ": enable row level security");
      lines.push("alter table public." + table + " enable row level security;");
      lines.push("");
      lines.push("-- " + table + ": select own merchant rows only");
      lines.push("drop policy if exists " + table + "_merchant_select on public." + table + ";");
      lines.push("create policy " + table + "_merchant_select");
      lines.push("on public." + table);
      lines.push("for select");
      lines.push("to authenticated");
      lines.push("using (merchant_id = " + claim + ");");
      lines.push("");
      lines.push("-- " + table + ": insert own merchant rows only");
      lines.push("drop policy if exists " + table + "_merchant_insert on public." + table + ";");
      lines.push("create policy " + table + "_merchant_insert");
      lines.push("on public." + table);
      lines.push("for insert");
      lines.push("to authenticated");
      lines.push("with check (merchant_id = " + claim + ");");
      lines.push("");
      lines.push("-- " + table + ": update own merchant rows only");
      lines.push("drop policy if exists " + table + "_merchant_update on public." + table + ";");
      lines.push("create policy " + table + "_merchant_update");
      lines.push("on public." + table);
      lines.push("for update");
      lines.push("to authenticated");
      lines.push("using (merchant_id = " + claim + ")");
      lines.push("with check (merchant_id = " + claim + ");");
      lines.push("");
      lines.push("-- " + table + ": delete own merchant rows only");
      lines.push("drop policy if exists " + table + "_merchant_delete on public." + table + ";");
      lines.push("create policy " + table + "_merchant_delete");
      lines.push("on public." + table);
      lines.push("for delete");
      lines.push("to authenticated");
      lines.push("using (merchant_id = " + claim + ");");
      lines.push("");
    });
    lines.push("-- Rollback SQL");
    tables.forEach(function(table){
      lines.push("drop policy if exists " + table + "_merchant_select on public." + table + ";");
      lines.push("drop policy if exists " + table + "_merchant_insert on public." + table + ";");
      lines.push("drop policy if exists " + table + "_merchant_update on public." + table + ";");
      lines.push("drop policy if exists " + table + "_merchant_delete on public." + table + ";");
      lines.push("alter table public." + table + " disable row level security;");
      lines.push("");
    });
    return lines.join("\n");
  }
  function sqlLiteral(value){
    return "'" + String(value == null ? "" : value).replace(/'/g, "''") + "'";
  }
  function ordersRlsManualPackageSql(){
    var merchantId = getCurrentMerchantId();
    var merchant = sqlLiteral(merchantId);
    var testOrderNo = sqlLiteral("RLS_TEST_" + merchantId);
    return [
      "-- orders_rls_test isolated RLS manual test package only.",
      "-- This package creates and tests public.orders_rls_test. It does not modify public.orders.",
      "-- Copy to Supabase SQL Editor manually after confirming backup and rollback readiness.",
      "-- This page only displays SQL text; it never executes SQL.",
      "",
      "-- 1. Create isolated test table by copying orders structure",
      "drop table if exists public.orders_rls_test;",
      "create table public.orders_rls_test (like public.orders including all);",
      "",
      "-- 2. Copy 1-2 existing merchant-scoped rows from orders into orders_rls_test",
      "insert into public.orders_rls_test",
      "select *",
      "from public.orders",
      "where merchant_id = " + merchant,
      "order by cloud_created_at desc",
      "limit 2;",
      "",
      "-- 3. Enable RLS for orders_rls_test only",
      "alter table public.orders_rls_test enable row level security;",
      "",
      "-- 4. SELECT policy: current merchant can read only its own test rows",
      "drop policy if exists orders_rls_test_merchant_select on public.orders_rls_test;",
      "create policy orders_rls_test_merchant_select",
      "on public.orders_rls_test",
      "for select",
      "to anon, authenticated",
      "using (merchant_id = " + merchant + ");",
      "",
      "-- 5. INSERT policy: current merchant can insert only its own test rows",
      "drop policy if exists orders_rls_test_merchant_insert on public.orders_rls_test;",
      "create policy orders_rls_test_merchant_insert",
      "on public.orders_rls_test",
      "for insert",
      "to anon, authenticated",
      "with check (merchant_id = " + merchant + ");",
      "",
      "-- 6. UPDATE policy: current merchant can update only its own test rows",
      "drop policy if exists orders_rls_test_merchant_update on public.orders_rls_test;",
      "create policy orders_rls_test_merchant_update",
      "on public.orders_rls_test",
      "for update",
      "to anon, authenticated",
      "using (merchant_id = " + merchant + ")",
      "with check (merchant_id = " + merchant + ");",
      "",
      "-- 7. DELETE policy: current merchant can delete only its own test rows",
      "drop policy if exists orders_rls_test_merchant_delete on public.orders_rls_test;",
      "create policy orders_rls_test_merchant_delete",
      "on public.orders_rls_test",
      "for delete",
      "to anon, authenticated",
      "using (merchant_id = " + merchant + ");",
      "",
      "-- 8. Test SQL",
      "-- Read test: must return only orders for merchant_id = " + merchant,
      "select id, merchant_id, order_no, status, cloud_created_at",
      "from public.orders_rls_test",
      "where merchant_id = " + merchant,
      "order by cloud_created_at desc",
      "limit 10;",
      "",
      "-- Insert test: creates one temporary orders_rls_test row for this merchant",
      "insert into public.orders_rls_test (merchant_id, order_no, customer_name, employee_id, employee_name, device_id, total_amount, paid_amount, debt_amount, status, items_json, local_created_at, cloud_created_at)",
      "values (" + merchant + ", " + testOrderNo + ", 'RLS测试客户', 'rls_test', 'RLS测试账号', 'rls_test_device', 0, 0, 0, 'RLS测试', '[]'::jsonb, now(), now())",
      "returning id, merchant_id, order_no;",
      "",
      "-- Update test: updates only the temporary test row",
      "update public.orders_rls_test",
      "set status = 'RLS测试已更新'",
      "where merchant_id = " + merchant,
      "  and order_no = " + testOrderNo,
      "returning id, merchant_id, order_no, status;",
      "",
      "-- Delete test: removes only the temporary test row",
      "delete from public.orders_rls_test",
      "where merchant_id = " + merchant,
      "  and order_no = " + testOrderNo,
      "returning id, merchant_id, order_no;",
      "",
      "-- 9. Rollback SQL for isolated test table only",
      "drop policy if exists orders_rls_test_merchant_select on public.orders_rls_test;",
      "drop policy if exists orders_rls_test_merchant_insert on public.orders_rls_test;",
      "drop policy if exists orders_rls_test_merchant_update on public.orders_rls_test;",
      "drop policy if exists orders_rls_test_merchant_delete on public.orders_rls_test;",
      "alter table public.orders_rls_test disable row level security;",
      "drop table if exists public.orders_rls_test;",
      "",
      "-- Rollback verification",
      "select to_regclass('public.orders_rls_test') as orders_rls_test_table;"
    ].join("\n");
  }
  function ensureRlsFreezePanel(){
    var root = document.getElementById("profileCenterRootV92");
    var grid = root && root.querySelector(".profile-v92-grid");
    if(!grid || document.getElementById("rlsFreezePanelV1")) return;
    var card = document.createElement("div");
    card.id = "rlsFreezePanelV1";
    card.className = "profile-v92-card commercial-sync-v1-card";
    card.innerHTML = '<div class="sync-console-v1-head"><div><h2>RLS 安全验证冻结</h2><p>当前状态：沙盒验证通过，正式 RLS 暂缓启用。</p></div><span class="commercial-sync-v1-status">已验证｜暂缓</span></div>'
      + '<div id="rlsFreezeStatusGridV1" class="commercial-sync-v1-grid" style="margin-top:12px"></div>'
      + '<div class="commercial-sync-v1-note">冻结说明：正式开启 RLS、执行 SQL、回滚 SQL 均暂停；SQL 区域仅作为归档展示，不能作为页面执行入口。保留 RLS 草案、执行清单、RLS 前备份和 orders_rls_test 沙盒记录。</div>';
    var after = document.getElementById("rlsPreflightPanelV1");
    if(after && after.parentNode === grid) grid.insertBefore(card, after.nextSibling);
    else grid.appendChild(card);
  }
  function renderRlsFreezePanel(){
    ensureRlsFreezePanel();
    var panel = document.getElementById("rlsFreezePanelV1");
    if(panel) panel.style.display = canShowAdminSyncTools() ? "" : "none";
    if(!canShowAdminSyncTools()) return;
    var grid = document.getElementById("rlsFreezeStatusGridV1");
    if(!grid) return;
    var rows = [
      ["当前状态", "沙盒验证通过，正式 RLS 暂缓启用"],
      ["orders_rls_test", "已创建并完成 RLS 沙盒验证"],
      ["orders_rls_test SELECT policy", "已验证"],
      ["orders_rls_test INSERT policy", "已创建"],
      ["正式 orders", "未开启 RLS"],
      ["正式 inventory", "未开启 RLS"],
      ["正式 employees", "未开启 RLS"],
      ["正式 cloud_snapshots", "未开启 RLS"],
      ["正式业务影响", "未受影响"]
    ];
    grid.innerHTML = rows.map(function(row){
      return '<div class="commercial-sync-v1-item"><span>'+e(row[0])+'</span><b>'+e(row[1])+'</b></div>';
    }).join("");
  }
  function ensureRlsPolicyDraftPanel(){
    var root = document.getElementById("profileCenterRootV92");
    var grid = root && root.querySelector(".profile-v92-grid");
    if(!grid || document.getElementById("rlsPolicyDraftPanelV1")) return;
    var card = document.createElement("div");
    card.id = "rlsPolicyDraftPanelV1";
    card.className = "profile-v92-card commercial-sync-v1-card";
    card.innerHTML = '<div class="sync-console-v1-head"><div><h2>RLS策略草案</h2><p>冻结归档展示；不连接数据库、不执行 ALTER TABLE、不启用 RLS。</p></div><span class="commercial-sync-v1-status">冻结归档</span></div>'
      + '<div class="commercial-sync-v1-note">策略目标：orders / inventory / employees / cloud_snapshots 均按 merchant_id 隔离。执行前必须先完成登录态 merchant_id claim 方案，否则会影响现有同步。</div>'
      + '<div class="commercial-sync-v1-note">展示内容：orders、inventory、employees、cloud_snapshots 的 enable/select/insert/update/delete policy，以及完整回滚 SQL。当前已冻结，暂不执行。</div>'
      + '<pre id="rlsPolicyDraftSqlV1" style="margin-top:12px;max-height:360px;overflow:auto;white-space:pre-wrap;background:#111b16;color:#edf7ef;border-radius:10px;padding:14px;font-size:12px;line-height:1.55;opacity:.58"></pre>'
      + '<div class="sync-console-v1-head" style="margin-top:14px"><div><h2>orders_rls_test RLS 沙盒记录</h2><p>沙盒验证记录已冻结；不继续开启正式 orders RLS。页面不会自动执行。</p></div><span class="commercial-sync-v1-status">冻结归档</span></div>'
      + '<div class="commercial-sync-v1-note">保留 orders_rls_test 建表、ENABLE RLS、SELECT/INSERT/UPDATE/DELETE policy、CRUD 测试 SQL、回滚 SQL 作为记录；不修改正式 orders，不包含任何 secret key。</div>'
      + '<pre id="ordersRlsManualPackageSqlV1" style="margin-top:12px;max-height:360px;overflow:auto;white-space:pre-wrap;background:#111b16;color:#edf7ef;border-radius:10px;padding:14px;font-size:12px;line-height:1.55;opacity:.58"></pre>';
    var after = document.getElementById("rlsPreflightPanelV1");
    if(after && after.parentNode === grid) grid.insertBefore(card, after.nextSibling);
    else grid.appendChild(card);
  }
  function renderRlsPolicyDraftPanel(){
    ensureRlsPolicyDraftPanel();
    var panel = document.getElementById("rlsPolicyDraftPanelV1");
    if(panel) panel.style.display = canShowAdminSyncTools() ? "" : "none";
    if(!canShowAdminSyncTools()) return;
    var sql = document.getElementById("rlsPolicyDraftSqlV1");
    if(sql) sql.textContent = rlsPolicyDraftSql();
    var ordersSql = document.getElementById("ordersRlsManualPackageSqlV1");
    if(ordersSql) ordersSql.textContent = ordersRlsManualPackageSql();
  }
  function rlsEnableChecklistItems(){
    return [
      "已备份当前 Supabase 数据",
      "orders 策略已确认",
      "inventory 策略已确认",
      "employees 策略已确认",
      "cloud_snapshots 策略已确认",
      "回滚 SQL 已准备",
      "测试账号已准备",
      "开启后测试读取/写入",
      "失败时立即执行回滚"
    ];
  }
  function ensureRlsEnableChecklistPanel(){
    var root = document.getElementById("profileCenterRootV92");
    var grid = root && root.querySelector(".profile-v92-grid");
    if(!grid || document.getElementById("rlsEnableChecklistPanelV1")) return;
    var card = document.createElement("div");
    card.id = "rlsEnableChecklistPanelV1";
    card.className = "profile-v92-card commercial-sync-v1-card";
    card.innerHTML = '<div class="sync-console-v1-head"><div><h2>RLS 开启执行清单</h2><p>正式开启前逐项确认；本清单只读展示，不执行 SQL、不修改数据库。</p></div><span class="commercial-sync-v1-status">未开启</span></div>'
      + '<div class="commercial-sync-v1-note">当前阶段仅用于上线前人工确认。禁止在本页面自动开启 RLS；开启前必须完成备份、策略复核、测试账号和回滚预案。</div>'
      + '<div id="rlsEnableChecklistBodyV1" class="commercial-sync-v1-grid" style="margin-top:12px"></div>'
      + '<div class="commercial-sync-v1-actions"><button class="commercial-sync-v1-btn" type="button" onclick="generateRlsPreEnableBackup()">生成 RLS 前备份</button><span id="rlsPreEnableBackupStatusV1" class="commercial-sync-v1-status">尚未备份</span></div>'
      + '<div id="rlsPreEnableBackupSummaryV1" class="commercial-sync-v1-grid" style="margin-top:12px"></div>';
    var after = document.getElementById("rlsPolicyDraftPanelV1");
    if(after && after.parentNode === grid) grid.insertBefore(card, after.nextSibling);
    else grid.appendChild(card);
  }
  function renderRlsEnableChecklistPanel(){
    ensureRlsEnableChecklistPanel();
    var panel = document.getElementById("rlsEnableChecklistPanelV1");
    if(panel) panel.style.display = canShowAdminSyncTools() ? "" : "none";
    if(!canShowAdminSyncTools()) return;
    var body = document.getElementById("rlsEnableChecklistBodyV1");
    if(!body) return;
    body.innerHTML = rlsEnableChecklistItems().map(function(item, index){
      return '<div class="commercial-sync-v1-item"><span>'+e("确认项 " + (index + 1))+'</span><b>'+e(item)+'</b></div>';
    }).join("");
    renderRlsPreEnableBackupSummary();
  }
  function rlsPreEnableBackupLastKey(){
    try{ return localStorage.getItem("cangjieLastRlsPreEnableBackupKeyV1") || ""; }
    catch(err){ return ""; }
  }
  function rlsPreEnableBackupState(){
    var key = rlsPreEnableBackupLastKey();
    return key ? readJson(key, null) : null;
  }
  function setRlsPreEnableBackupStatus(text){
    var el = document.getElementById("rlsPreEnableBackupStatusV1");
    if(el) el.textContent = text || "尚未备份";
  }
  function renderRlsPreEnableBackupSummary(){
    var box = document.getElementById("rlsPreEnableBackupSummaryV1");
    if(!box) return;
    var backup = rlsPreEnableBackupState();
    if(!backup){
      box.innerHTML = '<div class="commercial-sync-v1-item"><span>备份状态</span><b>尚未生成 RLS 前备份</b></div>';
      setRlsPreEnableBackupStatus("尚未备份");
      return;
    }
    var counts = backup.counts || {};
    setRlsPreEnableBackupStatus("已备份：" + (backup.createdAt || ""));
    box.innerHTML = [
      ["备份时间", backup.createdAt || ""],
      ["本地备份键", backup.id || ""],
      ["orders 数量", counts.orders || 0],
      ["inventory 数量", counts.inventory || 0],
      ["employees 数量", counts.employees || 0],
      ["cloud_snapshots 数量", counts.cloud_snapshots || 0]
    ].map(function(row){
      return '<div class="commercial-sync-v1-item"><span>'+e(row[0])+'</span><b>'+e(row[1])+'</b></div>';
    }).join("");
  }
  async function readRlsBackupTableRows(client, builder){
    var query = builder(client).select("*").eq("merchant_id", getCurrentMerchantId()).range(0, 9999);
    var result = await query;
    if(result.error) throw result.error;
    return result.data || [];
  }
  async function generateRlsPreEnableBackup(){
    if(!canUseCloudSync()){
      setRlsPreEnableBackupStatus(window.CANGJIE_LAST_CLOUD_SYNC_BLOCK_MESSAGE || "云同步不可用");
      return {data:null, error:window.CANGJIE_LAST_CLOUD_SYNC_BLOCK_MESSAGE || "云同步不可用", blocked:true};
    }
    var client = initSupabaseClient();
    if(!client){
      var initError = window.CANGJIE_SUPABASE_CONFIG.lastError || "Supabase 未初始化";
      setRlsPreEnableBackupStatus("备份失败：" + initError);
      return {data:null, error:initError};
    }
    setRlsPreEnableBackupStatus("生成备份中...");
    try{
      var rows = {
        orders:await readRlsBackupTableRows(client, publicOrdersTable),
        inventory:await readRlsBackupTableRows(client, publicInventoryTable),
        employees:await readRlsBackupTableRows(client, publicEmployeesTable),
        cloud_snapshots:await readRlsBackupTableRows(client, function(c){ return c.from("cloud_snapshots"); })
      };
      var createdAt = now();
      var key = "rls_backup_" + createdAt.replace(/[^0-9A-Za-z]/g, "");
      var backup = {
        id:key,
        createdAt:createdAt,
        merchantId:getCurrentMerchantId(),
        source:"rls_pre_enable_backup",
        note:"本地 RLS 开启前备份；只读 Supabase 并保存到 localStorage，未写入数据库。",
        counts:{
          orders:rows.orders.length,
          inventory:rows.inventory.length,
          employees:rows.employees.length,
          cloud_snapshots:rows.cloud_snapshots.length
        },
        tables:rows
      };
      writeJson(key, backup);
      localStorage.setItem("cangjieLastRlsPreEnableBackupKeyV1", key);
      var index = readJson("cangjieRlsPreEnableBackupIndexV1", []);
      index.unshift({id:key, createdAt:createdAt, merchantId:backup.merchantId, counts:backup.counts});
      writeJson("cangjieRlsPreEnableBackupIndexV1", index.slice(0, 20));
      renderRlsPreEnableBackupSummary();
      return {data:backup, error:null};
    }catch(err){
      var message = err && err.message ? err.message : String(err);
      setRlsPreEnableBackupStatus("备份失败：" + message);
      return {data:null, error:err};
    }
  }
  function setSyncConsoleGlobalStatus(text){
    var value = text || "未检查";
    var el = document.getElementById("syncConsoleStatusV1");
    if(el) el.textContent = value;
    var adminEl = document.getElementById("syncConsoleStatusAdminV1");
    if(adminEl) adminEl.textContent = value;
  }
  function ensureSyncConsolePanel(){
    var root = document.getElementById("profileCenterRootV92");
    var grid = root && root.querySelector(".profile-v92-grid");
    if(!grid || document.getElementById("syncConsolePanelV1")) return;
    var card = document.createElement("div");
    card.id = "syncConsolePanelV1";
    card.className = "profile-v92-card commercial-sync-v1-card";
    card.innerHTML = '<div class="sync-console-v1-head"><div><h2>同步总控制台</h2><p>集中检查订单、库存、员工和云端快照状态；所有检查只读，不会覆盖本地数据。</p></div><span id="syncConsoleStatusV1" class="commercial-sync-v1-status">未检查</span></div>'
      + '<div id="syncConsoleIdentityV1" class="commercial-sync-v1-grid" style="margin-top:12px"></div>'
      + '<div class="sync-console-v1-table-wrap" style="margin-top:12px"><table class="sync-console-v1-table"><thead><tr><th>模块</th><th>健康状态</th><th>最近上传时间</th><th>最近读取时间</th><th>最近一次检查时间</th><th>最近同步结果</th><th>云端记录数量</th><th>错误详情</th></tr></thead><tbody id="syncConsoleBodyV1"></tbody></table></div>'
      + '<div class="commercial-sync-v1-note">只读检查入口已收纳到“管理员同步工具”；不会调用合并、恢复、清空、覆盖或自动同步流程。</div>';
    var after = document.getElementById("commercialSyncPanelV1");
    if(after && after.parentNode === grid) grid.insertBefore(card, after.nextSibling);
    else grid.appendChild(card);
  }
  function renderSyncConsolePanel(){
    ensureSyncConsolePanel();
    var panel = document.getElementById("syncConsolePanelV1");
    if(panel) panel.style.display = canShowAdminSyncTools() ? "" : "none";
    if(!canShowAdminSyncTools()) return;
    var idBox = document.getElementById("syncConsoleIdentityV1");
    var body = document.getElementById("syncConsoleBodyV1");
    if(!idBox || !body) return;
    var m = meta();
    var account = currentAccount();
    var state = syncConsoleState();
    setSyncConsoleGlobalStatus("总体同步状态：" + (state.overallHealthStatus || "未检测"));
    idBox.innerHTML = [
      ["当前登录账号", (account.employee_name || account.name || account.role || "主账号") + (account.phone ? " " + account.phone : "")],
      ["当前设备ID", m.deviceId || ""],
      ["当前商户ID", getCurrentMerchantId() || ""],
      ["总体同步状态", healthBadge(state.overallHealthStatus || "未检测")],
      ["最近健康检查", state.lastHealthCheckAt || "尚未检测"],
      ["健康摘要", state.lastHealthSummary || "尚未进行同步健康检查"]
    ].map(function(row){
      var value = String(row[1] || "-");
      return '<div class="commercial-sync-v1-item"><span>'+e(row[0])+'</span><b>'+(value.indexOf("sync-console-v1-health") >= 0 ? value : e(value))+'</b></div>';
    }).join("");
    var keys = ["orders","inventory","employees","snapshots"];
    body.innerHTML = keys.map(function(key){
      var row = state.modules[key] || {};
      return '<tr><td>'+e(row.label || key)+'</td>'
        + '<td>'+healthBadge(row.healthStatus || "未检测")+'</td>'
        + '<td>'+e(row.lastUploadAt || "尚未记录")+'</td>'
        + '<td>'+e(row.lastReadAt || "尚未读取")+'</td>'
        + '<td>'+e(row.lastHealthCheckAt || "尚未检测")+'</td>'
        + '<td>'+e(row.lastResult || "尚未检查")+'</td>'
        + '<td>'+e(row.cloudCount == null ? "-" : row.cloudCount)+'</td>'
        + '<td class="'+(row.hasError ? "sync-console-v1-error" : "sync-console-v1-ok")+'">'+(row.error ? e(row.error) : "无")+'</td></tr>';
    }).join("");
  }
  function setEmployeeCloudStatus(text){
    var value = text || "未同步员工权限";
    var el = document.getElementById("employeeCloudStatus");
    if(el) el.textContent = value;
    var adminEl = document.getElementById("employeeCloudStatusAdminV1");
    if(adminEl) adminEl.textContent = value;
  }
  function normalizeEmployeeCloudPermissions(perms){
    if(Array.isArray(perms)) return perms;
    if(typeof perms === "string"){
      try{
        var parsed = JSON.parse(perms);
        return Array.isArray(parsed) ? parsed : [];
      }catch(err){
        return perms ? perms.split(/[、,，]/).map(function(item){ return item.trim(); }).filter(Boolean) : [];
      }
    }
    return [];
  }
  function localEmployeesForCloud(){
    var rows = readJson("cangjieEmployeesV94", readJson("cangjieEmployeesV93", []));
    return Array.isArray(rows) ? rows : [];
  }
  function employeeCloudKey(row){
    row = row || {};
    return {
      id:String(row.employee_id || row.employeeId || row.id || "").trim(),
      phone:String(row.phone || "").trim()
    };
  }
  function employeeRowsForCloud(){
    var m = meta();
    var at = now();
    return localEmployeesForCloud().map(function(row){
      var key = employeeCloudKey(row);
      return {
        merchant_id:getCurrentMerchantId(),
        employee_id:key.id || ("emp_" + Date.now()),
        employee_name:row.employee_name || row.employeeName || row.name || "",
        phone:key.phone,
        role:row.role || "收银员",
        status:row.status === "停用" ? "禁用" : (row.status || "启用"),
        permissions_json:normalizeEmployeeCloudPermissions(row.permissions || row.permissions_json),
        device_id:m.deviceId || "dev_local_seed",
        local_updated_at:row.local_updated_at || row.updatedAt || at,
        cloud_updated_at:at
      };
    }).filter(function(row){
      return row.employee_id || row.phone || row.employee_name;
    });
  }
  function cloudEmployeeToLocal(row){
    row = row || {};
    var employeeId = row.employee_id || row.employeeId || row.id || ("emp_cloud_" + Date.now());
    var employeeName = row.employee_name || row.employeeName || row.name || "";
    return {
      id:employeeId,
      employee_id:employeeId,
      employee_name:employeeName,
      name:employeeName,
      phone:row.phone || "",
      wechat:row.wechat || "",
      role:row.role || "收银员",
      status:row.status === "停用" ? "禁用" : (row.status || "启用"),
      permissions:normalizeEmployeeCloudPermissions(row.permissions_json || row.permissions),
      cloudEmployeeRowId:row.id || "",
      cloudDeviceId:row.device_id || "",
      cloudUpdatedAt:row.cloud_updated_at || ""
    };
  }
  function backupBeforeEmployeesMerge(){
    var key = "backup_before_employees_merge_" + Date.now();
    var backup = {key:key, createdAt:now(), localStorage:{}};
    for(var i=0;i<localStorage.length;i++){
      var name = localStorage.key(i);
      backup.localStorage[name] = localStorage.getItem(name);
    }
    localStorage.setItem(key, JSON.stringify(backup));
    localStorage.setItem("cangjie_last_employees_merge_backup_key", key);
    return key;
  }
  async function pushEmployeesToCloud(){
    if(!canUseCloudSync()) return cloudSyncBlockedResult("employees_push", setEmployeeCloudStatus);
    var client = initSupabaseClient();
    if(!client){
      var initError = window.CANGJIE_SUPABASE_CONFIG.lastError || "Supabase 未初始化";
      setEmployeeCloudStatus("员工上传失败：" + initError);
      return {data:null, error:initError};
    }
    var rows = employeeRowsForCloud();
    if(!rows.length){
      setEmployeeCloudStatus("暂无本地员工可上传");
      return {data:[], error:null};
    }
    setEmployeeCloudStatus("员工权限上传中...");
    try{
      var result = await publicEmployeesTable(client).insert(rows).select();
      console.log("员工权限上传结果:", result.data, result.error);
      if(result.error){
        var message = result.error.message || String(result.error);
        setEmployeeCloudStatus("员工上传失败：" + message);
      }else{
        var saved = result.data || [];
        setEmployeeCloudStatus("员工上传成功：" + (saved.length || rows.length) + " 条");
      }
      return {data:result.data, error:result.error};
    }catch(err){
      var errText = err && err.message ? err.message : String(err);
      setEmployeeCloudStatus("员工上传失败：" + errText);
      console.error("员工权限上传异常:", err);
      return {data:null, error:err};
    }
  }
  async function readCloudEmployees(){
    if(!canUseCloudSync()) return cloudSyncBlockedResult("employees_read", setEmployeeCloudStatus);
    var client = initSupabaseClient();
    if(!client){
      var initError = window.CANGJIE_SUPABASE_CONFIG.lastError || "Supabase 未初始化";
      setEmployeeCloudStatus("云端员工读取失败：" + initError);
      return {data:null, error:initError};
    }
    setEmployeeCloudStatus("读取云端员工中...");
    try{
      var merchantId = getCurrentMerchantId();
      var result = await publicEmployeesTable(client)
        .select("*")
        .eq("merchant_id", merchantId)
        .order("cloud_updated_at", {ascending:false});
      console.log("云端员工读取结果:", result.data, result.error);
      if(result.error){
        var message = result.error.message || String(result.error);
        setEmployeeCloudStatus("云端员工读取失败：" + message);
      }else{
        var rows = result.data || [];
        window.CANGJIE_LAST_CLOUD_EMPLOYEES = rows;
        setEmployeeCloudStatus("读取成功：" + rows.length + " 条云端员工");
      }
      return {data:result.data, error:result.error};
    }catch(err){
      var errText = err && err.message ? err.message : String(err);
      setEmployeeCloudStatus("云端员工读取失败：" + errText);
      console.error("云端员工读取异常:", err);
      return {data:null, error:err};
    }
  }
  async function mergeCloudEmployeesToLocal(){
    if(!canUseCloudSync()) return Object.assign({merged:0, skipped:0, cloudTotal:0, backupKey:""}, cloudSyncBlockedResult("employees_merge", setEmployeeCloudStatus));
    setEmployeeCloudStatus("准备合并云端员工...");
    var readResult = await readCloudEmployees();
    if(readResult.error){
      var readMessage = readResult.error && readResult.error.message ? readResult.error.message : String(readResult.error);
      setEmployeeCloudStatus("云端员工读取失败：" + readMessage);
      return {merged:0, skipped:0, cloudTotal:0, backupKey:"", error:readResult.error};
    }
    var cloudRows = readResult.data || [];
    var backupKey = backupBeforeEmployeesMerge();
    var localRows = localEmployeesForCloud();
    var existingIds = {};
    var existingPhones = {};
    localRows.forEach(function(row){
      var key = employeeCloudKey(row);
      if(key.id) existingIds[key.id] = true;
      if(key.phone) existingPhones[key.phone] = true;
    });
    var merged = 0;
    var skipped = 0;
    cloudRows.forEach(function(row){
      var key = employeeCloudKey(row);
      if((key.id && existingIds[key.id]) || (key.phone && existingPhones[key.phone])){
        skipped++;
        return;
      }
      var local = cloudEmployeeToLocal(row);
      localRows.push(local);
      if(local.employee_id) existingIds[local.employee_id] = true;
      if(local.phone) existingPhones[local.phone] = true;
      merged++;
    });
    localStorage.setItem("cangjieEmployeesV94", JSON.stringify(localRows));
    localStorage.setItem("cangjieEmployeesV93", JSON.stringify(localRows));
    try{ if(typeof window.renderEmployeesV94 === "function") window.renderEmployeesV94(); }catch(err){}
    var statusText = "云端员工：" + cloudRows.length + " 条｜新增本地：" + merged + " 条｜跳过重复：" + skipped + " 条";
    setEmployeeCloudStatus(statusText);
    console.log("云端员工合并结果:", {cloudTotal:cloudRows.length, merged:merged, skipped:skipped, backupKey:backupKey});
    return {merged:merged, skipped:skipped, cloudTotal:cloudRows.length, backupKey:backupKey, error:null};
  }
  function setCloudInventoryStatus(text){
    var value = text || "未同步云端库存";
    var el = document.getElementById("cloudInventoryStatusV1");
    if(el) el.textContent = value;
    var inventoryEl = document.getElementById("inventoryCloudStatus");
    if(inventoryEl) inventoryEl.textContent = value;
    var adminEl = document.getElementById("inventoryCloudStatusAdminV1");
    if(adminEl) adminEl.textContent = value;
  }
  function localBatchesForInventoryCloud(){
    try{
      if(typeof batches !== "undefined" && Array.isArray(batches)) return batches;
    }catch(err){}
    var data = readJson(PERSIST_KEY, null) || readJson("tudou2_data", {}) || {};
    return Array.isArray(data.batches) ? data.batches : [];
  }
  function numberV1(value){
    var n = Number(value || 0);
    return Number.isFinite(n) ? n : 0;
  }
  function inventoryCloudKey(row){
    return String((row && (row.product_id || row.productId || row.goodsId || "")) || "").trim()
      + "|"
      + String((row && (row.batch_no || row.batchNo || row.no || "")) || "").trim();
  }
  function backupBeforeInventoryMerge(){
    var key = "backup_before_inventory_merge_" + Date.now();
    var backup = {key:key, createdAt:now(), localStorage:{}};
    for(var i=0;i<localStorage.length;i++){
      var name = localStorage.key(i);
      backup.localStorage[name] = localStorage.getItem(name);
    }
    localStorage.setItem(key, JSON.stringify(backup));
    localStorage.setItem("cangjie_last_inventory_merge_backup_key", key);
    return key;
  }
  function buildInventoryRowsForCloud(){
    var m = meta();
    var at = now();
    var rows = [];
    localBatchesForInventoryCloud().forEach(function(batch, batchIndex){
      var items = Array.isArray(batch.items) ? batch.items : [];
      items.forEach(function(item, itemIndex){
        var qty = numberV1(item.qty);
        var spec = numberV1(item.spec);
        var inWeight = item.pack === "定装" ? qty * spec : numberV1(item.weight);
        var soldQty = numberV1(item.sold);
        var soldWeight = item.pack === "定装" ? soldQty * spec : numberV1(item.soldWeight);
        if(item.pack !== "定装" && qty > 0 && soldQty >= qty && inWeight > 0 && soldWeight < inWeight){
          soldWeight = inWeight;
        }
        var remainQty = Math.max(0, qty - soldQty);
        var remainWeight = Math.max(0, inWeight - soldWeight);
        rows.push({
          merchant_id:getCurrentMerchantId(),
          product_id:String(item.goodsId || item.productId || item.id || (batch.id || "batch") + "_" + itemIndex),
          product_name:item.name || item.productName || "",
          batch_no:batch.no || batch.batchNo || batch.id || String(batchIndex + 1),
          owner_name:batch.owner || batch.ownerName || "",
          stock_qty:remainQty,
          stock_weight:remainWeight,
          sold_qty:soldQty,
          sold_weight:soldWeight,
          device_id:m.deviceId || "dev_local_seed",
          local_updated_at:at,
          cloud_updated_at:at
        });
      });
    });
    return rows;
  }
  function renderCloudInventoryList(rows){
    var wrap = document.getElementById("inventoryStep1Table") || document.getElementById("stockTableWrap");
    if(!wrap) return;
    if(!rows || !rows.length){
      wrap.innerHTML = '<div class="stock-empty">云端暂无库存数据。</div>';
      return;
    }
    wrap.innerHTML = '<div class="cloud-inventory-v1-list">'
      + '<h3 class="cloud-inventory-v1-title">云端库存列表</h3>'
      + '<p class="cloud-inventory-v1-note">这里只读取 Supabase inventory 表，不覆盖本地库存；点击“刷新批次”可回到本地库存视图。</p>'
      + '<table class="cloud-inventory-v1-table"><thead><tr>'
      + '<th>货品</th><th>批次</th><th>货主</th><th>剩余件数</th><th>剩余斤数</th><th>已售件数</th><th>已售斤数</th><th>云端时间</th>'
      + '</tr></thead><tbody>'
      + rows.map(function(row){
        return '<tr>'
          + '<td>' + e(row.product_name || "") + '</td>'
          + '<td>' + e(row.batch_no || "") + '</td>'
          + '<td>' + e(row.owner_name || "") + '</td>'
          + '<td>' + e(row.stock_qty || 0) + '</td>'
          + '<td>' + e(row.stock_weight || 0) + '</td>'
          + '<td>' + e(row.sold_qty || 0) + '</td>'
          + '<td>' + e(row.sold_weight || 0) + '</td>'
          + '<td>' + e(row.cloud_updated_at || "") + '</td>'
          + '</tr>';
      }).join("")
      + '</tbody></table></div>';
  }
  async function pushInventorySnapshotToCloud(){
    if(!canUseCloudSync()) return cloudSyncBlockedResult("inventory_push", setCloudInventoryStatus);
    var client = initSupabaseClient();
    if(!client){
      var initError = window.CANGJIE_SUPABASE_CONFIG.lastError || "Supabase 未初始化";
      setCloudInventoryStatus("库存上传失败：" + initError);
      return {data:null, error:initError};
    }
    var rows = buildInventoryRowsForCloud();
    if(!rows.length){
      setCloudInventoryStatus("暂无本地库存可上传");
      return {data:[], error:null};
    }
    setCloudInventoryStatus("库存上传中...");
    try{
      var result = await publicInventoryTable(client).insert(rows).select();
      console.log("库存上传结果:", result.data, result.error);
      if(result.error){
        var message = result.error.message || String(result.error);
        setCloudInventoryStatus("库存上传失败：" + message);
      }else{
        var saved = result.data || [];
        setCloudInventoryStatus("库存上传成功：" + (saved.length || rows.length) + " 条");
      }
      return {data:result.data, error:result.error};
    }catch(err){
      var errText = err && err.message ? err.message : String(err);
      setCloudInventoryStatus("库存上传失败：" + errText);
      console.error("库存上传异常:", err);
      return {data:null, error:err};
    }
  }
  async function readCloudInventory(){
    if(!canUseCloudSync()){
      renderCloudInventoryList([]);
      return cloudSyncBlockedResult("inventory_read", setCloudInventoryStatus);
    }
    var client = initSupabaseClient();
    if(!client){
      var initError = window.CANGJIE_SUPABASE_CONFIG.lastError || "Supabase 未初始化";
      setCloudInventoryStatus("云端库存读取失败：" + initError);
      renderCloudInventoryList([]);
      return {data:null, error:initError};
    }
    setCloudInventoryStatus("读取云端库存中...");
    try{
      var merchantId = getCurrentMerchantId();
      var result = await publicInventoryTable(client)
        .select("*")
        .eq("merchant_id", merchantId)
        .order("cloud_updated_at", {ascending:false});
      console.log("云端库存读取结果:", result.data, result.error);
      if(result.error){
        var message = result.error.message || String(result.error);
        setCloudInventoryStatus("云端库存读取失败：" + message);
        renderCloudInventoryList([]);
      }else{
        var rows = result.data || [];
        window.CANGJIE_LAST_CLOUD_INVENTORY_ROWS = rows;
        setCloudInventoryStatus("读取成功：" + rows.length + " 条云端库存");
        renderCloudInventoryList(rows);
      }
      return {data:result.data, error:result.error};
    }catch(err){
      var errText = err && err.message ? err.message : String(err);
      setCloudInventoryStatus("云端库存读取失败：" + errText);
      renderCloudInventoryList([]);
      console.error("云端库存读取异常:", err);
      return {data:null, error:err};
    }
  }
  async function mergeCloudInventoryToLocal(){
    if(!canUseCloudSync()) return Object.assign({merged:0, skipped:0, cloudTotal:0, backupKey:""}, cloudSyncBlockedResult("inventory_merge", setCloudInventoryStatus));
    setCloudInventoryStatus("准备合并云端库存...");
    var readResult = await readCloudInventory();
    if(readResult.error){
      var readMessage = readResult.error && readResult.error.message ? readResult.error.message : String(readResult.error);
      setCloudInventoryStatus("云端库存读取失败：" + readMessage);
      return {merged:0, skipped:0, cloudTotal:0, backupKey:"", error:readResult.error};
    }
    var cloudRows = readResult.data || [];
    var backupKey = backupBeforeInventoryMerge();
    var raw = localStorage.getItem(PERSIST_KEY) || localStorage.getItem("tudou2_data");
    var localData = {};
    try{ localData = raw ? JSON.parse(raw) : {}; }catch(err){ localData = {}; }
    var localBatches = [];
    try{
      if(typeof batches !== "undefined" && Array.isArray(batches)) localBatches = batches;
    }catch(err){}
    if(!localBatches.length){
      localBatches = Array.isArray(localData.batches) ? localData.batches : [];
    }
    if(!Array.isArray(localBatches)){
      localBatches = [];
    }
    var existing = {};
    localBatches.forEach(function(batch){
      (Array.isArray(batch.items) ? batch.items : []).forEach(function(item){
        var key = inventoryCloudKey({
          product_id:item.goodsId || item.productId || item.id,
          batch_no:batch.no || batch.batchNo || batch.id
        });
        if(key !== "|") existing[key] = true;
      });
    });
    var merged = 0;
    var skipped = 0;
    cloudRows.forEach(function(row){
      var key = inventoryCloudKey(row);
      if(!key || key === "|" || existing[key]){
        skipped++;
        return;
      }
      var batchNo = String(row.batch_no || "").trim() || ("cloud_" + Date.now().toString(36));
      var batch = localBatches.find(function(b){
        return String(b.no || b.batchNo || b.id || "") === batchNo;
      });
      if(!batch){
        batch = {
          id:"cloud_batch_" + Math.random().toString(36).slice(2,9),
          owner:row.owner_name || "云端库存",
          no:batchNo,
          tag:"云端",
          fee:0,
          remark:"云端库存安全合并",
          confirmed:true,
          inboundConfirmedAt:now(),
          cloudMergedAt:now(),
          items:[]
        };
        localBatches.push(batch);
      }
      if(!Array.isArray(batch.items)) batch.items = [];
      var stockQty = numberV1(row.stock_qty);
      var stockWeight = numberV1(row.stock_weight);
      var soldQty = numberV1(row.sold_qty);
      var soldWeight = numberV1(row.sold_weight);
      batch.items.push({
        id:"cloud_item_" + Math.random().toString(36).slice(2,9),
        goodsId:String(row.product_id || ""),
        name:row.product_name || "云端商品",
        type:"非",
        pack:"非定装",
        spec:"",
        unit:"件",
        qty:stockQty + soldQty,
        weight:stockWeight + soldWeight,
        purchasePrice:0,
        costPrice:0,
        salePrice:0,
        fixedPrice:0,
        sold:soldQty,
        soldWeight:soldWeight,
        cloudInventoryId:row.id || "",
        cloudDeviceId:row.device_id || "",
        cloudUpdatedAt:row.cloud_updated_at || ""
      });
      existing[key] = true;
      merged++;
    });
    localData.batches = localBatches;
    localData.savedAt = new Date().toLocaleString("zh-CN", {hour12:false});
    try{ if(typeof batches !== "undefined") batches = localBatches; }catch(err){}
    localStorage.setItem(PERSIST_KEY, JSON.stringify(localData));
    try{ if(typeof renderInventoryStep1 === "function") renderInventoryStep1(); }catch(err){}
    try{ if(typeof renderCashierAll === "function") renderCashierAll(); }catch(err){}
    try{ if(typeof renderCashierProducts === "function") renderCashierProducts(); }catch(err){}
    var statusText = "云端库存：" + cloudRows.length + " 条｜新增本地：" + merged + " 条｜跳过重复：" + skipped + " 条";
    setCloudInventoryStatus(statusText);
    console.log("云端库存合并结果:", {cloudTotal:cloudRows.length, merged:merged, skipped:skipped, backupKey:backupKey});
    return {merged:merged, skipped:skipped, cloudTotal:cloudRows.length, backupKey:backupKey, error:null};
  }
  function setCloudOrdersReadStatus(text){
    var value = text || "未读取云端订单";
    var el = document.getElementById("cloudOrdersStatusV1");
    if(el) el.textContent = value;
    var adminEl = document.getElementById("cloudOrdersStatusAdminV1");
    if(adminEl) adminEl.textContent = value;
  }
  function renderCloudOrdersList(rows){
    var title = document.getElementById("ordersDetailTitle");
    var sub = document.getElementById("ordersDetailSub");
    var box = document.getElementById("ordersDetailBody");
    if(title) title.textContent = "云端订单列表";
    if(sub) sub.textContent = "只读取 Supabase orders 表，不覆盖本地订单、不合并库存。";
    if(!box) return;
    if(!rows || !rows.length){
      box.innerHTML = '<div class="orders-empty">云端暂无订单。</div>';
      return;
    }
    box.innerHTML = '<div class="cloud-orders-v1-list">' + rows.map(function(row){
      return '<div class="cloud-orders-v1-row">'
        + '<b>订单 ' + e(row.order_no || row.id || "") + '</b>'
        + '<span>客户：' + e(row.customer_name || "") + '</span>'
        + '<span>金额：¥' + Number(row.total_amount || 0).toFixed(2) + '｜状态：' + e(row.status || "") + '</span>'
        + '<span>开单人：' + e(row.employee_name || "") + '</span>'
        + '<span>云端时间：' + e(row.cloud_created_at || "") + '</span>'
        + '</div>';
    }).join("") + '</div>';
  }
  async function readCloudOrders(){
    if(!canUseCloudSync()){
      renderCloudOrdersList([]);
      return cloudSyncBlockedResult("orders_read", setCloudOrdersReadStatus);
    }
    var client = initSupabaseClient();
    if(!client){
      var initError = window.CANGJIE_SUPABASE_CONFIG.lastError || "Supabase 未初始化";
      setCloudOrdersReadStatus("云端订单读取失败：" + initError);
      renderCloudOrdersList([]);
      return {data:null, error:initError};
    }
    setCloudOrdersReadStatus("读取中...");
    try{
      var result = await publicOrdersTable(client)
        .select("*")
        .eq("merchant_id", getCurrentMerchantId())
        .order("cloud_created_at", {ascending:false});
      console.log("云端订单读取结果:", JSON.stringify({data:result.data, error:result.error}));
      if(result.error){
        var message = result.error.message || String(result.error);
        setCloudOrdersReadStatus("云端订单读取失败：" + message);
        renderCloudOrdersList([]);
      }else{
        var rows = result.data || [];
        setCloudOrdersReadStatus("读取成功：" + rows.length + " 条云端订单");
        renderCloudOrdersList(rows);
      }
      return {data:result.data, error:result.error};
    }catch(err){
      var errText = err && err.message ? err.message : String(err);
      setCloudOrdersReadStatus("云端订单读取失败：" + errText);
      renderCloudOrdersList([]);
      console.error("云端订单读取异常:", err);
      return {data:null, error:err};
    }
  }
  function cloudOrderNoV1(row){
    return String((row && (row.order_no || row.orderNo || row.billNo || row.id)) || "").trim();
  }
  function localOrderNoV1(row){
    return String((row && (row.orderNo || row.billNo || row.id || row.order_no)) || "").trim();
  }
  function cloudRowToLocalOrder(row){
    var orderNo = cloudOrderNoV1(row) || String(Date.now());
    return {
      id:row.id || ("cloud_" + orderNo),
      orderNo:orderNo,
      billNo:orderNo,
      customerName:row.customer_name || "未知客户",
      totalAmount:Number(row.total_amount || 0),
      paid:Number(row.paid_amount || 0),
      debt:Number(row.debt_amount || 0),
      status:row.status || "已收银",
      displayStatus:row.status || "已收银",
      employeeName:row.employee_name || "",
      employeeId:row.employee_id || "",
      deviceId:row.device_id || "",
      lines:Array.isArray(row.items_json) ? row.items_json : [],
      time:row.local_created_at || row.cloud_created_at || now(),
      cloudCreatedAt:row.cloud_created_at || "",
      cloudOrderId:row.id || "",
      recordSource:"云端订单"
    };
  }
  function backupBeforeCloudMerge(){
    var key = "backup_before_merge_" + Date.now();
    var backup = {key:key, createdAt:now(), localStorage:{}};
    for(var i=0;i<localStorage.length;i++){
      var name = localStorage.key(i);
      backup.localStorage[name] = localStorage.getItem(name);
    }
    localStorage.setItem(key, JSON.stringify(backup));
    localStorage.setItem("cangjie_last_cloud_merge_backup_key", key);
    return key;
  }
  async function mergeCloudOrdersToLocal(){
    if(!canUseCloudSync()) return Object.assign({merged:0, skipped:0, total:0}, cloudSyncBlockedResult("orders_merge", setCloudOrdersReadStatus));
    var client = initSupabaseClient();
    if(!client){
      var initError = window.CANGJIE_SUPABASE_CONFIG.lastError || "Supabase 未初始化";
      setCloudOrdersReadStatus("云端订单读取失败：" + initError);
      return {merged:0, skipped:0, total:0, error:initError};
    }
    setCloudOrdersReadStatus("合并前备份中...");
    try{
      var backupKey = backupBeforeCloudMerge();
      var raw = localStorage.getItem(PERSIST_KEY) || localStorage.getItem("tudou2_data");
      var localData = raw ? JSON.parse(raw) : {};
      var localOrders = Array.isArray(localData.orders) ? localData.orders.slice() : [];
      var finalRows = Array.isArray(localData.finalOrders) ? localData.finalOrders : [];
      var existing = {};
      localOrders.concat(finalRows).forEach(function(row){
        var key = localOrderNoV1(row);
        if(key) existing[key] = true;
      });
      setCloudOrdersReadStatus("读取云端订单中...");
      var result = await publicOrdersTable(client)
        .select("*")
        .eq("merchant_id", getCurrentMerchantId())
        .order("cloud_created_at", {ascending:false});
      if(result.error){
        var message = result.error.message || String(result.error);
        setCloudOrdersReadStatus("云端订单读取失败：" + message);
        return {merged:0, skipped:0, total:0, error:result.error, backupKey:backupKey};
      }
      var rows = result.data || [];
      var merged = 0;
      var skipped = 0;
      rows.forEach(function(row){
        var key = cloudOrderNoV1(row);
        if(!key || existing[key]){
          skipped++;
          return;
        }
        localOrders.push(cloudRowToLocalOrder(row));
        existing[key] = true;
        merged++;
      });
      localData.orders = localOrders;
      localData.cloudMergedAt = now();
      localData.cloudMergeBackupKey = backupKey;
      localStorage.setItem(PERSIST_KEY, JSON.stringify(localData));
      setCloudOrdersReadStatus("云端订单数量：" + rows.length + "｜新增到本地：" + merged + "｜跳过重复：" + skipped);
      renderCloudOrdersList(rows);
      console.log("云端订单合并结果:", JSON.stringify({cloudTotal:rows.length, merged:merged, skipped:skipped, backupKey:backupKey}));
      return {merged:merged, skipped:skipped, total:rows.length, backupKey:backupKey, error:null};
    }catch(err){
      var errText = err && err.message ? err.message : String(err);
      setCloudOrdersReadStatus("云端订单读取失败：" + errText);
      console.error("云端订单合并异常:", err);
      return {merged:0, skipped:0, total:0, error:err};
    }
  }
  function normalizeOrderItemsForCloud(order){
    var items = order && (order.lines || order.items || order.goods || order.details);
    if(!Array.isArray(items)) items = [];
    return items.map(function(item, idx){
      return {
        index:item.index || idx + 1,
        name:item.name || item.goodsName || "",
        qty:Number(item.qty || item.count || 0),
        weight:Number(item.weight || item.jin || 0),
        price:Number(item.price || item.unitPrice || 0),
        amount:Number(item.amount || item.total || 0),
        owner:item.owner || "",
        batchNo:item.batchNo || "",
        unit:item.unit || "件",
        type:item.type || item.pack || ""
      };
    });
  }
  function buildCloudOrderRow(order){
    order = stampOrder(order || {});
    var m = meta();
    var account = currentAccount();
    var total = Number(order.totalAmount || order.total || order.amount || order.receivable || 0);
    var paid = Number(order.paidAmount || order.paid || order.realPaid || 0);
    var debt = Number(order.debtAmount || order.debt || Math.max(total - paid, 0) || 0);
    return {
      merchant_id:getCurrentMerchantId(),
      order_no:order.billNo || order.orderNo || order.id || String(Date.now()),
      customer_name:order.customerName || order.buyerName || order.customer || "未知客户",
      employee_id:order.employee_id || order.employeeId || order.userId || account.employee_id || m.userId || account.id || "owner",
      employee_name:order.employee_name || order.employeeName || order.cashierName || account.employee_name || account.name || "主账号",
      device_id:order.deviceId || m.deviceId || "dev_local_seed",
      total_amount:total,
      paid_amount:paid,
      debt_amount:debt,
      status:order.status || order.displayStatus || "已收银",
      items_json:Array.isArray(order.lines) ? order.lines : normalizeOrderItemsForCloud(order),
      local_created_at:order.createdAt || order.time || now(),
      cloud_created_at:now()
    };
  }
  function latestLocalOrderForCloud(){
    var raw = localStorage.getItem("tudou2_v57_persistent_data")
      || localStorage.getItem("tudou2_data");
    if(!raw){
      console.log("没有本地数据");
      return null;
    }
    var data;
    try{
      data = JSON.parse(raw);
    }catch(err){
      console.log("本地订单数据解析失败", err);
      return null;
    }
    var source = "orders";
    var orders = Array.isArray(data.orders) && data.orders.length ? data.orders : [];
    if(!orders.length && Array.isArray(data.finalOrders) && data.finalOrders.length){
      source = "finalOrders";
      orders = data.finalOrders;
    }
    if(!orders.length){
      console.log("没有订单");
      return null;
    }
    return source === "finalOrders" ? orders[0] : orders[orders.length - 1];
  }
  async function pushLatestOrderToCloud(){
    console.log("开始同步订单");
    var lastOrder = latestLocalOrderForCloud();
    if(!lastOrder) return {data:null, error:"没有订单"};
    console.log("准备上传订单:", lastOrder);
    var key = cloudOrderKey(lastOrder) || String(Date.now());
    if(!canUseCloudSync({silent:true})){
      var blockMessage = window.CANGJIE_LAST_CLOUD_SYNC_BLOCK_MESSAGE || "云同步不可用";
      setCloudOrderSyncResult(blockMessage, now());
      writeSyncLog("cloud_order_push", "未连接", blockMessage, {orderNo:key});
      return {data:null, error:null, skipped:true, reason:"cloud_sync_blocked"};
    }
    var ledger = cloudOrderSyncLedger();
    if(ledger[key] && ledger[key].status === "success"){
      return {data:null, error:null, skipped:true, reason:"already_synced"};
    }
    if(window.__cangjieCloudOrderSyncingV1 && window.__cangjieCloudOrderSyncingV1[key]){
      return {data:null, error:null, skipped:true, reason:"in_flight"};
    }
    window.__cangjieCloudOrderSyncingV1 = window.__cangjieCloudOrderSyncingV1 || {};
    window.__cangjieCloudOrderSyncingV1[key] = true;
    var client = initSupabaseClient();
    if(!client){
      var initError = window.CANGJIE_SUPABASE_CONFIG.lastError || "Supabase 未初始化";
      setCloudOrderSyncResult("订单已本地保存，云端订单同步失败", now());
      if(typeof toast === "function") toast("订单已保存，云端同步失败");
      writeSyncLog("cloud_order_push", "同步失败", "订单已本地保存；Supabase 未初始化，单笔订单未同步。", {orderNo:key, error:initError});
      window.__cangjieCloudOrderSyncingV1[key] = false;
      return {data:null, error:initError};
    }
    try{
      var row = buildCloudOrderRow(lastOrder);
      var result = await publicOrdersTable(client)
        .insert([row])
        .select();
      console.log("订单写入结果:", JSON.stringify({data:result.data, error:result.error}));
      var check = await publicOrdersTable(client).select("*").eq("merchant_id", getCurrentMerchantId());
      console.log("数据库实际数据:", JSON.stringify(check));
      if(result.error){
        var message = result.error.message || String(result.error);
        ledger[key] = {status:"failed", time:now(), error:message};
        saveCloudOrderSyncLedger(ledger);
        setCloudOrderSyncResult("订单已本地保存，云端订单同步失败", now());
        if(typeof toast === "function") toast("订单已保存，云端同步失败");
        writeSyncLog("cloud_order_push", "同步失败", "订单已本地保存；单笔订单写入 orders 表失败。", {orderNo:key, error:message});
      }else{
        var cloudId = result.data && result.data[0] && result.data[0].id;
        ledger[key] = {status:"success", time:now(), cloudId:cloudId || ""};
        saveCloudOrderSyncLedger(ledger);
        setCloudOrderSyncResult("云端订单同步成功：" + key, now());
        updateSyncStatus("已连接", {lastSyncAt:now()});
        writeSyncLog("cloud_order_push", "已连接", "订单完成后已单独写入 Supabase orders 表。", {orderNo:key, cloudId:cloudId});
      }
      window.__cangjieCloudOrderSyncingV1[key] = false;
      return result;
    }catch(err){
      var errText = err && err.message ? err.message : String(err);
      ledger[key] = {status:"failed", time:now(), error:errText};
      saveCloudOrderSyncLedger(ledger);
      setCloudOrderSyncResult("订单已本地保存，云端订单同步失败", now());
      if(typeof toast === "function") toast("订单已保存，云端同步失败");
      writeSyncLog("cloud_order_push", "同步失败", "订单已本地保存；单笔订单写入 orders 表异常。", {orderNo:key, error:errText});
      console.log("云端订单写入异常，本地已保存:", err);
      window.__cangjieCloudOrderSyncingV1[key] = false;
      return {data:null, error:err};
    }
  }
  function persistentData(){
    return readJson(PERSIST_KEY, {});
  }
  function getMerchantScopedData(){
    var m = meta();
    var data = persistentData();
    return {
      merchantId:getCurrentMerchantId(),
      userId:m.userId,
      deviceId:m.deviceId,
      role:m.role,
      syncVersion:m.syncVersion,
      dataUpdatedAt:m.dataUpdatedAt,
      merchants:merchantProfile(),
      users:readJson("cangjieEmployeesV94", readJson("cangjieEmployeesV93", [])),
      permissions:{role:m.role, userId:m.userId},
      products:data.goodsMaster || [],
      owners:data.owners || [],
      customers:data.cashierCustomers || data.customers || [],
      batches:data.batches || [],
      inventory:{batches:data.batches || [], updatedAt:m.dataUpdatedAt},
      orders:data.finalOrders || [],
      debts:{repayments:data.repayments || [], buyerRepayments:data.buyerV47Repayments || []},
      printSettings:readJson("tudou2_printer_config_step1", {}),
      syncLogs:m.syncLogs || []
    };
  }
  function buildCloudPayload(){
    var m = meta();
    return {
      merchantId:getCurrentMerchantId(),
      deviceId:m.deviceId,
      userId:m.userId,
      role:m.role,
      deploymentMode:m.deploymentMode,
      databaseSource:m.databaseSource,
      syncVersion:m.syncVersion,
      localUpdatedAt:m.dataUpdatedAt,
      cloudUpdatedAt:m.cloudUpdatedAt || "",
      collections:getMerchantScopedData(),
      schema:readJson(SCHEMA_KEY, cloudSchema())
    };
  }
  function buildBusinessSnapshot(){
    var payload = buildCloudPayload();
    var scoped = getMerchantScopedData();
    var ts = Date.now();
    var builtAt = now();
    return {
      merchant_id:payload.merchantId,
      device_id:payload.deviceId,
      data_type:"full_snapshot",
      sync_version:ts,
      cloud_updated_at:builtAt,
      built_at:builtAt,
      payload:{
        merchantId:payload.merchantId,
        deviceId:payload.deviceId,
        userId:payload.userId,
        role:payload.role,
        deploymentMode:payload.deploymentMode,
        databaseSource:payload.databaseSource,
        syncVersion:ts,
        localUpdatedAt:payload.localUpdatedAt,
        cloudUpdatedAt:builtAt,
        collections:{
          merchants:scoped.merchants,
          users:scoped.users,
          permissions:scoped.permissions,
          products:scoped.products,
          owners:scoped.owners,
          customers:scoped.customers,
          batches:scoped.batches,
          inventory:scoped.inventory,
          orders:scoped.orders,
          debts:scoped.debts,
          printSettings:scoped.printSettings,
          syncLogs:scoped.syncLogs
        }
      }
    };
  }
  async function pushBusinessSnapshot(){
    console.log("开始上传业务快照");
    if(!canUseCloudSync()) return cloudSyncBlockedResult("business_snapshot_push", setSnapshotText);
    var client = initSupabaseClient();
    if(!client){
      var initError = window.CANGJIE_SUPABASE_CONFIG.lastError || "Supabase 未初始化";
      console.log("业务快照上传结果:", null, initError);
      setSnapshotText("上传失败：" + initError);
      writeSyncLog("business_snapshot_push", "同步失败", "Supabase 未初始化，业务快照未上传。");
      return {data:null, error:initError};
    }
    var snapshot = buildBusinessSnapshot();
    setSnapshotText("上传中...");
    updateSyncStatus("同步中");
    try{
      var result = await client
        .from("cloud_snapshots")
        .insert([{
          merchant_id:snapshot.merchant_id,
          device_id:snapshot.device_id,
          data_type:snapshot.data_type,
          payload:snapshot.payload,
          sync_version:snapshot.sync_version,
          cloud_updated_at:snapshot.cloud_updated_at
        }])
        .select();
      console.log("业务快照上传结果:", result.data, result.error);
      if(result.error){
        var message = result.error.message || String(result.error);
        setSnapshotText("上传失败：" + message);
        updateSyncStatus("同步失败");
        writeSyncLog("business_snapshot_push", "同步失败", "业务快照上传失败。", {error:message});
      }else{
        var snapshotId = (result.data && result.data[0] && result.data[0].id) || "已生成快照";
        setSnapshotText("业务快照上传成功：" + snapshotId);
        updateSyncStatus("已连接", {lastSyncAt:snapshot.cloud_updated_at, cloudUpdatedAt:snapshot.cloud_updated_at});
        writeSyncLog("business_snapshot_push", "已连接", "业务完整快照已上传到 cloud_snapshots。", {rows:result.data || []});
      }
      return {data:result.data, error:result.error};
    }catch(err){
      var errText = err && err.message ? err.message : String(err);
      console.log("业务快照上传结果:", null, err);
      setSnapshotText("上传失败：" + errText);
      updateSyncStatus("同步失败");
      writeSyncLog("business_snapshot_push", "同步失败", "业务快照上传异常。", {error:errText});
      return {data:null, error:err};
    }
  }
  async function readBusinessSnapshot(){
    console.log("开始读取业务快照");
    if(!canUseCloudSync()) return cloudSyncBlockedResult("business_snapshot_read", setSnapshotText);
    var client = initSupabaseClient();
    if(!client){
      var initError = window.CANGJIE_SUPABASE_CONFIG.lastError || "Supabase 未初始化";
      console.log("业务快照读取结果:", null, initError);
      setSnapshotText("读取失败：" + initError);
      writeSyncLog("business_snapshot_read", "同步失败", "Supabase 未初始化，业务快照未读取。");
      return {data:null, error:initError};
    }
    setSnapshotText("读取中...");
    try{
      var result = await client
        .from("cloud_snapshots")
        .select("*")
        .eq("merchant_id", getCurrentMerchantId())
        .eq("data_type", "full_snapshot")
        .order("cloud_updated_at", {ascending:false})
        .limit(1);
      console.log("业务快照读取结果:", result.data, result.error);
      if(result.error){
        var message = result.error.message || String(result.error);
        setSnapshotText("读取失败：" + message);
        updateSyncStatus("同步失败");
        writeSyncLog("business_snapshot_read", "同步失败", "业务快照读取失败。", {error:message});
      }else{
        var count = (result.data || []).length;
        setSnapshotText(count ? "读取成功：最新快照 " + (result.data[0].cloud_updated_at || "") : "读取成功：暂无快照");
        updateSyncStatus("已连接", {lastSyncAt:now()});
        writeSyncLog("business_snapshot_read", "已连接", "已读取最新业务快照；未自动覆盖本地数据。", {count:count});
      }
      return {data:result.data, error:result.error};
    }catch(err){
      var errText = err && err.message ? err.message : String(err);
      console.log("业务快照读取结果:", null, err);
      setSnapshotText("读取失败：" + errText);
      updateSyncStatus("同步失败");
      writeSyncLog("business_snapshot_read", "同步失败", "业务快照读取异常。", {error:errText});
      return {data:null, error:err};
    }
  }
  function renderSnapshotPreview(row){
    var el = document.getElementById("commercialSyncSnapshotPreviewV1");
    if(!el) return;
    if(!row){
      el.innerHTML = '<div class="commercial-sync-v1-note">暂无云端业务快照预览。</div>';
      return;
    }
    var payload = row.payload || {};
    var collections = payload.collections || {};
    var size = 0;
    try{ size = JSON.stringify(payload).length; }catch(err){}
    var preview = [
      "merchantId: " + (payload.merchantId || row.merchant_id || ""),
      "products: " + ((collections.products || []).length || 0),
      "owners: " + ((collections.owners || []).length || 0),
      "customers: " + ((collections.customers || []).length || 0),
      "batches: " + ((collections.batches || []).length || 0),
      "orders: " + ((collections.orders || []).length || 0)
    ].join("｜");
    el.innerHTML = '<div class="commercial-sync-v1-grid">'
      + '<div class="commercial-sync-v1-item"><span>快照ID</span><b>'+e(row.id || "")+'</b></div>'
      + '<div class="commercial-sync-v1-item"><span>云端更新时间</span><b>'+e(row.cloud_updated_at || "")+'</b></div>'
      + '<div class="commercial-sync-v1-item"><span>设备ID</span><b>'+e(row.device_id || "")+'</b></div>'
      + '<div class="commercial-sync-v1-item"><span>数据大小</span><b>'+e(size + " 字符")+'</b></div>'
      + '</div><div class="commercial-sync-v1-note">payload 预览：'+e(preview)+'</div>';
  }
  async function readLatestBusinessSnapshot(){
    console.log("开始读取最新云端业务快照");
    if(!canUseCloudSync()){
      renderSnapshotPreview(null);
      return cloudSyncBlockedResult("business_snapshot_preview", setSnapshotText);
    }
    var client = initSupabaseClient();
    if(!client){
      var initError = window.CANGJIE_SUPABASE_CONFIG.lastError || "Supabase 未初始化";
      console.log("最新业务快照读取结果:", null, initError);
      setSnapshotText("读取失败：" + initError);
      renderSnapshotPreview(null);
      writeSyncLog("business_snapshot_preview", "同步失败", "Supabase 未初始化，最新业务快照未读取。");
      return {data:null, error:initError};
    }
    setSnapshotText("读取中...");
    try{
      var result = await client
        .from("cloud_snapshots")
        .select("*")
        .eq("merchant_id", getCurrentMerchantId())
        .eq("data_type", "full_snapshot")
        .order("cloud_updated_at", {ascending:false})
        .limit(1);
      console.log("最新业务快照读取结果:", result.data, result.error);
      if(result.error){
        var message = result.error.message || String(result.error);
        setSnapshotText("读取失败：" + message);
        renderSnapshotPreview(null);
        updateSyncStatus("同步失败");
        writeSyncLog("business_snapshot_preview", "同步失败", "最新业务快照读取失败。", {error:message});
      }else{
        var row = (result.data || [])[0] || null;
        setSnapshotText(row ? "读取成功：" + row.id : "读取成功：暂无快照");
        renderSnapshotPreview(row);
        updateSyncStatus("已连接", {lastSyncAt:now()});
        writeSyncLog("business_snapshot_preview", "已连接", "已读取最新业务快照预览；未覆盖本地数据。", {snapshotId:row && row.id});
      }
      return {data:result.data, error:result.error};
    }catch(err){
      var errText = err && err.message ? err.message : String(err);
      console.log("最新业务快照读取结果:", null, err);
      setSnapshotText("读取失败：" + errText);
      renderSnapshotPreview(null);
      updateSyncStatus("同步失败");
      writeSyncLog("business_snapshot_preview", "同步失败", "最新业务快照读取异常。", {error:errText});
      return {data:null, error:err};
    }
  }
  function backupLocalStorageBeforeCloudRestore(){
    var key = "backup_before_cloud_restore_" + Date.now();
    var backup = {
      key:key,
      createdAt:now(),
      href:location.href,
      localStorage:{}
    };
    try{
      for(var i=0;i<localStorage.length;i++){
        var name = localStorage.key(i);
        backup.localStorage[name] = localStorage.getItem(name);
      }
      localStorage.setItem(key, JSON.stringify(backup));
      localStorage.setItem("cangjie_last_cloud_restore_backup_key", key);
    }catch(err){
      console.error("生成云端恢复前备份失败：", err);
      throw err;
    }
    return backup;
  }
  function applySnapshotPayloadToLocalStorage(row){
    if(!row || !row.payload) throw new Error("云端快照 payload 为空");
    var payload = row.payload || {};
    var collections = payload.collections || {};
    var current = readJson(PERSIST_KEY, {});
    var next = Object.assign({}, current);
    if(collections.products) next.goodsMaster = collections.products;
    if(collections.owners) next.owners = collections.owners;
    if(collections.customers) next.cashierCustomers = collections.customers;
    if(collections.batches) next.batches = collections.batches;
    if(collections.orders) next.finalOrders = collections.orders;
    if(collections.debts){
      next.repayments = collections.debts.repayments || next.repayments || [];
      next.buyerV47Repayments = collections.debts.buyerRepayments || next.buyerV47Repayments || [];
    }
    next.restoredFromCloudSnapshotId = row.id || "";
    next.restoredFromCloudAt = now();
    localStorage.setItem(PERSIST_KEY, JSON.stringify(next));
    if(collections.merchants) localStorage.setItem("cangjieMerchantProfileV92", JSON.stringify(collections.merchants));
    if(collections.users){
      localStorage.setItem("cangjieEmployeesV93", JSON.stringify(collections.users));
      localStorage.setItem("cangjieEmployeesV94", JSON.stringify(collections.users));
    }
    var m = meta();
    m.lastSyncAt = now();
    m.cloudStatus = "已连接";
    m.cloudUpdatedAt = row.cloud_updated_at || m.cloudUpdatedAt || "";
    m.dataUpdatedAt = now();
    m.syncVersion = Number(row.sync_version || m.syncVersion || 1);
    saveMeta(m);
    localStorage.setItem("cangjie_last_restored_cloud_snapshot_id", row.id || "");
    localStorage.setItem("cangjie_last_restored_cloud_snapshot_at", now());
  }
  async function restoreLatestBusinessSnapshotSafely(){
    console.log("开始安全恢复云端业务快照");
    var status = document.getElementById("commercialSyncRestoreStatusV1");
    function setRestoreText(text){
      if(status) status.textContent = text || "未恢复";
    }
    if(!canUseCloudSync()) return Object.assign({backup:null}, cloudSyncBlockedResult("business_snapshot_restore", setRestoreText));
    var backup;
    try{
      backup = backupLocalStorageBeforeCloudRestore();
    }catch(err){
      var backupError = err && err.message ? err.message : String(err);
      setRestoreText("备份失败：" + backupError);
      writeSyncLog("business_snapshot_restore", "同步失败", "恢复前备份失败，已停止恢复。", {error:backupError});
      return {data:null, error:err, backup:null};
    }
    var ok = confirm("此操作会用云端快照覆盖当前本地数据，系统已自动备份当前本地数据，是否继续？");
    if(!ok){
      setRestoreText("已取消恢复，已生成本地备份：" + backup.key);
      writeSyncLog("business_snapshot_restore", "已取消", "用户取消云端恢复；本地备份已保留。", {backupKey:backup.key});
      return {data:null, error:null, canceled:true, backup:backup};
    }
    var client = initSupabaseClient();
    if(!client){
      var initError = window.CANGJIE_SUPABASE_CONFIG.lastError || "Supabase 未初始化";
      setRestoreText("恢复失败：" + initError);
      writeSyncLog("business_snapshot_restore", "同步失败", "Supabase 未初始化，未执行恢复。", {backupKey:backup.key});
      return {data:null, error:initError, backup:backup};
    }
    setRestoreText("恢复中...");
    try{
      var result = await client
        .from("cloud_snapshots")
        .select("*")
        .eq("merchant_id", getCurrentMerchantId())
        .eq("data_type", "full_snapshot")
        .order("cloud_updated_at", {ascending:false})
        .limit(1);
      console.log("云端恢复读取结果:", result.data, result.error);
      if(result.error){
        var message = result.error.message || String(result.error);
        setRestoreText("恢复失败：" + message);
        updateSyncStatus("同步失败");
        writeSyncLog("business_snapshot_restore", "同步失败", "读取云端快照失败，未覆盖本地数据。", {backupKey:backup.key, error:message});
        return {data:result.data, error:result.error, backup:backup};
      }
      var row = (result.data || [])[0] || null;
      if(!row){
        setRestoreText("恢复失败：暂无云端快照");
        writeSyncLog("business_snapshot_restore", "同步失败", "暂无可恢复的云端快照。", {backupKey:backup.key});
        return {data:null, error:"暂无云端快照", backup:backup};
      }
      applySnapshotPayloadToLocalStorage(row);
      setRestoreText("恢复成功，已生成本地备份");
      writeSyncLog("business_snapshot_restore", "已连接", "已从云端快照恢复到本地；恢复前备份已保留。", {backupKey:backup.key, snapshotId:row.id});
      alert("恢复成功，已生成本地备份");
      setTimeout(function(){ location.reload(); }, 600);
      return {data:row, error:null, backup:backup};
    }catch(err){
      var errText = err && err.message ? err.message : String(err);
      console.log("云端恢复异常:", err);
      setRestoreText("恢复失败：" + errText);
      updateSyncStatus("同步失败");
      writeSyncLog("business_snapshot_restore", "同步失败", "云端快照恢复异常。", {backupKey:backup.key, error:errText});
      return {data:null, error:err, backup:backup};
    }
  }
  function pullCloudSnapshot(){
    if(!canUseCloudSync()) return Promise.resolve(Object.assign({connected:false, cloudStatus:"未连接"}, cloudSyncBlockedResult("pull", null)));
    updateSyncStatus("未连接");
    writeSyncLog("pull", "未连接", "云同步尚未接入真实服务，本次仅返回空快照占位。");
    return Promise.resolve({connected:false, cloudStatus:"未连接", data:null});
  }
  function pushLocalChanges(){
    var payload = buildCloudPayload();
    if(!canUseCloudSync()) return Promise.resolve(Object.assign({connected:false, cloudStatus:"未连接", payload:payload}, cloudSyncBlockedResult("push", null)));
    updateSyncStatus("未连接");
    writeSyncLog("push", "未连接", "云同步尚未接入真实服务，本地变更继续保存在 storage.js/localStorage。", {syncVersion:payload.syncVersion});
    return Promise.resolve({connected:false, cloudStatus:"未连接", payload:payload});
  }
  function resolveSyncConflict(localCopy, cloudCopy){
    var m = meta();
    var localAt = localCopy && localCopy.cloudUpdatedAt ? localCopy.cloudUpdatedAt : (localCopy && localCopy.dataUpdatedAt) || "";
    var cloudAt = cloudCopy && cloudCopy.cloudUpdatedAt ? cloudCopy.cloudUpdatedAt : "";
    var useCloud = cloudAt && (!localAt || cloudAt > localAt);
    var log = {
      id:"conflict_" + Date.now().toString(36),
      time:now(),
      merchantId:getCurrentMerchantId(),
      deviceId:m.deviceId,
      policy:"cloudUpdatedAt 较新者优先；保留本地副本",
      selected:useCloud ? "cloud" : "local",
      localCopy:localCopy || null,
      cloudCopy:cloudCopy || null
    };
    m.conflictLogs = Array.isArray(m.conflictLogs) ? m.conflictLogs : [];
    m.conflictLogs.unshift(log);
    saveMeta(m);
    writeSyncLog("conflict", "同步失败", "检测到同步冲突，已保留本地副本并写入 conflictLog。", {conflictId:log.id});
    return {selected:useCloud ? cloudCopy : localCopy, conflictLog:log};
  }
  function stampOrder(order){
    if(!order || typeof order !== "object") return order;
    var m = meta();
    var account = currentAccount();
    order.merchantId = order.merchantId || getCurrentMerchantId();
    order.userId = order.userId || account.employee_id || account.employeeId || m.userId;
    order.employee_id = order.employee_id || order.employeeId || account.employee_id || account.employeeId || order.userId || "owner";
    order.employeeId = order.employeeId || order.employee_id;
    order.employee_name = order.employee_name || order.employeeName || order.cashierName || account.employee_name || account.name || (m.role === "owner" ? "主账号" : "员工");
    order.employeeName = order.employeeName || order.employee_name;
    order.employeeRole = order.employeeRole || (account.role === "owner" ? "管理员" : (account.role || "管理员"));
    order.employee_phone = order.employee_phone || account.phone || "";
    order.employeePhone = order.employeePhone || account.phone || "";
    order.deviceId = order.deviceId || m.deviceId;
    order.createdAt = order.createdAt || order.time || now();
    order.cloudUpdatedAt = order.cloudUpdatedAt || "";
    return order;
  }
  function stampExistingOrders(){
    try{
      if(typeof finalOrders !== "undefined" && Array.isArray(finalOrders)){
        finalOrders.forEach(stampOrder);
      }
    }catch(err){}
  }
  function wrapOrderFunction(name){
    var old = window[name];
    if(typeof old !== "function" || old.__commercialSyncV1) return;
    window[name] = function(){
      for(var i=0;i<arguments.length;i++) stampOrder(arguments[i]);
      var beforeOrderFingerprint = orderAutoSyncFingerprint();
      var result = old.apply(this, arguments);
      setTimeout(function(){
        stampExistingOrders();
        markDataUpdated();
        var afterOrderFingerprint = orderAutoSyncFingerprint();
        if(afterOrderFingerprint && afterOrderFingerprint !== beforeOrderFingerprint){
          pushLatestOrderToCloud();
          autoUploadBusinessSnapshotAfterOrder(name);
        }
      }, 0);
      return result;
    };
    window[name].__commercialSyncV1 = true;
  }
  function ensureCommercialSyncPanel(){
    var root = document.getElementById("profileCenterRootV92");
    var grid = root && root.querySelector(".profile-v92-grid");
    if(!grid || document.getElementById("commercialSyncPanelV1")) return;
    var card = document.createElement("div");
    card.id = "commercialSyncPanelV1";
    card.className = "profile-v92-card commercial-sync-v1-card";
    card.innerHTML = '<h2>数据同步</h2><p>当前为本机数据模式：数据先保存在本机 localStorage，刷新页面不会丢失；多端同步需接入云端数据库后再启用。</p>'
      + '<div id="commercialSyncGridV1" class="commercial-sync-v1-grid"></div>'
      + '<div class="commercial-sync-v1-actions"><label class="commercial-sync-v1-toggle"><input id="autoSyncEnabledV1" type="checkbox"> 自动同步</label><span id="commercialSyncAutoStatusV1" class="commercial-sync-v1-status">自动同步：关闭</span></div>'
      + '<div id="adminSyncToolsSlotV1"></div>'
      + '<div class="commercial-sync-v1-note">当前版本先保证单机持久化稳定；未来云端集合预留为 merchants / users / permissions / products / owners / customers / batches / inventory / orders / debts / printSettings / syncLogs，业务快照表预留为 cloud_snapshots。未接入云端前，不会宣称已多端同步。</div>';
    grid.appendChild(card);
  }
  function renderAdminSyncTools(){
    ensureCommercialSyncPanel();
    var slot = document.getElementById("adminSyncToolsSlotV1");
    if(!slot) return;
    if(!canShowAdminSyncTools()){
      slot.innerHTML = "";
      return;
    }
    if(!document.getElementById("adminSyncToolsV1")){
      slot.innerHTML = '<details id="adminSyncToolsV1" class="admin-sync-tools-v1"><summary>管理员同步工具</summary><div class="admin-sync-tools-v1-body">'
        + '<div class="admin-sync-tools-v1-group"><h3>连接测试</h3><div class="commercial-sync-v1-actions"><button id="testCloudConnectionV1" class="commercial-sync-v1-btn" type="button">测试云连接</button><span id="commercialSyncConnectionStatusV1" class="commercial-sync-v1-status">未测试</span></div><div class="commercial-sync-v1-actions"><button id="testCloudInsertV1" class="commercial-sync-v1-btn" type="button" onclick="testInsert()">测试写入云端</button><span id="commercialSyncInsertStatusV1" class="commercial-sync-v1-status">未写入</span></div><div class="commercial-sync-v1-actions"><button id="testCloudReadV1" class="commercial-sync-v1-btn" type="button" onclick="testReadCloud()">测试读取云端</button><span id="commercialSyncReadStatusV1" class="commercial-sync-v1-status">未读取</span></div></div>'
        + '<div class="admin-sync-tools-v1-group"><h3>业务快照</h3><div class="commercial-sync-v1-actions"><button id="pushBusinessSnapshotV1" class="commercial-sync-v1-btn" type="button" onclick="pushBusinessSnapshot()">上传业务快照</button><button id="readBusinessSnapshotV1" class="commercial-sync-v1-btn" type="button" onclick="readBusinessSnapshot()">读取业务快照</button><button id="readLatestBusinessSnapshotV1" class="commercial-sync-v1-btn" type="button" onclick="readLatestBusinessSnapshot()">读取云端快照</button><button id="restoreBusinessSnapshotV1" class="commercial-sync-v1-btn" type="button" onclick="restoreLatestBusinessSnapshotSafely()">从云端恢复到本地</button><span id="commercialSyncSnapshotStatusV1" class="commercial-sync-v1-status">未同步快照</span><span id="commercialSyncRestoreStatusV1" class="commercial-sync-v1-status">未恢复</span></div><div id="commercialSyncSnapshotPreviewV1"></div></div>'
        + '<div class="admin-sync-tools-v1-group"><h3>订单同步</h3><div class="commercial-sync-v1-actions"><button id="readCloudOrdersBtnV1" class="commercial-sync-v1-btn" type="button" onclick="readCloudOrders()">读取云端订单</button><button id="mergeCloudOrdersBtnV1" class="commercial-sync-v1-btn" type="button" onclick="mergeCloudOrdersToLocal()">合并云端订单到本地</button><button class="commercial-sync-v1-btn" type="button" onclick="checkOrderSyncConsole()">检查订单同步</button><span id="cloudOrdersStatusV1" class="commercial-sync-v1-status">未读取云端订单</span></div></div>'
        + '<div class="admin-sync-tools-v1-group"><h3>库存同步</h3><div class="commercial-sync-v1-actions"><button id="pushInventorySnapshotV1" class="commercial-sync-v1-btn" type="button" onclick="pushInventorySnapshotToCloud()">上传库存到云端</button><button id="readCloudInventoryV1" class="commercial-sync-v1-btn" type="button" onclick="readCloudInventory()">读取云端库存</button><button class="commercial-sync-v1-btn" type="button" onclick="mergeCloudInventoryToLocal()">合并云库存到本地</button><button class="commercial-sync-v1-btn" type="button" onclick="checkInventorySyncConsole()">检查库存同步</button><span id="cloudInventoryStatusV1" class="commercial-sync-v1-status">未同步云端库存</span></div></div>'
        + '<div class="admin-sync-tools-v1-group"><h3>员工同步</h3><div class="commercial-sync-v1-actions"><button class="commercial-sync-v1-btn" type="button" onclick="pushEmployeesToCloud()">上传员工权限</button><button class="commercial-sync-v1-btn" type="button" onclick="readCloudEmployees()">读取云端员工</button><button class="commercial-sync-v1-btn" type="button" onclick="mergeCloudEmployeesToLocal()">合并云端员工</button><button class="commercial-sync-v1-btn" type="button" onclick="checkEmployeeSyncConsole()">检查员工同步</button><span id="employeeCloudStatusAdminV1" class="commercial-sync-v1-status">未同步员工权限</span></div></div>'
        + '<div class="admin-sync-tools-v1-group"><h3>同步检查</h3><div class="commercial-sync-v1-actions"><button class="commercial-sync-v1-btn" type="button" onclick="checkSnapshotSyncConsole()">检查云快照</button><button class="commercial-sync-v1-btn" type="button" onclick="checkAllSyncConsole()">一键检查全部</button><button class="commercial-sync-v1-btn" type="button" onclick="runSyncHealthCheck()">同步健康检查</button><button class="commercial-sync-v1-btn" type="button" onclick="runRlsCommercialPrecheck()">RLS预检</button><button class="commercial-sync-v1-btn" data-local-action-v1="1" type="button" onclick="clearSyncConsoleErrors()">清除错误提示</button><span id="syncConsoleStatusAdminV1" class="commercial-sync-v1-status">未检查</span><span id="rlsPreflightStatusAdminV1" class="commercial-sync-v1-status">RLS未检测</span></div></div>'
        + '</div></details>';
    }
    var details = document.getElementById("adminSyncToolsV1");
    if(details) details.style.display = "";
    updateCloudSyncButtonsV1();
  }
  function renderCommercialSyncPanel(){
    ensureCommercialSyncPanel();
    renderSyncConsolePanel();
    renderRlsPreflightPanel();
    renderRlsFreezePanel();
    renderRlsPolicyDraftPanel();
    renderRlsEnableChecklistPanel();
    var panel = document.getElementById("commercialSyncPanelV1");
    if(panel) panel.style.display = canShowAdminSyncTools() ? "" : "none";
    if(!canShowAdminSyncTools()) return;
    var box = document.getElementById("commercialSyncGridV1");
    if(!box) return;
    var m = meta();
    var account = currentAccount();
    var fields = [
      ["当前数据模式", isLocalOnlyDeployment() ? "本机数据模式（localStorage）" : "云端部署模式"],
      ["当前部署模式", deploymentModeLabel(m.deploymentMode)],
      ["当前数据库来源", m.databaseSource || deploymentDatabaseSource()],
      ["当前商户ID", getCurrentMerchantId()],
      ["当前设备ID", m.deviceId],
      ["当前登录员工", (account.name || m.role || "管理员") + (account.phone ? " " + account.phone : "")],
      ["同步状态", isLocalOnlyDeployment() ? "本机持久化已开启｜未启用多端云同步" : ("v" + (m.syncVersion || 1) + "｜" + (m.syncEnabled ? "已开启" : "未开启"))],
      ["最后同步时间", m.lastSyncAt || "尚未同步"],
      ["云端连接状态", '<span class="commercial-sync-v1-pill">'+e(m.cloudStatus || "未连接")+'</span>'],
      ["离线可用状态", m.offlineAvailable === false ? "不可用" : "可离线开单"],
      ["本地更新时间", m.dataUpdatedAt || "未记录"],
      ["自动同步", m.autoSyncEnabled ? "开启" : "关闭"],
      ["当前模式", autoSyncModeLabel(m.autoSyncMode)],
      ["最近一次自动上传时间", m.lastAutoSyncAt || "尚未自动上传"],
      ["最近一次自动上传结果", m.lastAutoSyncResult || "尚未自动上传"],
      ["最近订单云同步时间", m.lastCloudOrderSyncAt || "尚未同步订单"],
      ["最近订单云同步结果", m.lastCloudOrderSyncResult || "尚未同步订单"]
    ];
    box.innerHTML = fields.map(function(row){
      return '<div class="commercial-sync-v1-item"><span>'+e(row[0])+'</span><b>'+row[1]+'</b></div>';
    }).join("");
    var autoInput = document.getElementById("autoSyncEnabledV1");
    if(autoInput){
      autoInput.checked = m.autoSyncEnabled === true;
      autoInput.disabled = !canUseCloudSync({silent:true});
    }
    setAutoSyncText(isLocalOnlyDeployment() ? "自动同步：关闭（本地模式）" : (m.autoSyncEnabled ? "自动同步：开启（仅上传快照）" : "自动同步：关闭"));
    renderAdminSyncTools();
    updateCloudSyncButtonsV1();
  }
  function initCommercialSync(){
    var firstBoot = !window.__commercialSyncV1Booted;
    window.__commercialSyncV1Booted = true;
    ensureDeploymentConfig();
    installDeploymentConfigRenderHook();
    ensureMeta();
    if(!isLocalOnlyDeployment()) initSupabaseClient();
    ["pushCompletedOrder","confirmOrderFromCodeBill","completeSettleOrder","checkoutCurrentOrder","finishOrder","submitOrder"].forEach(wrapOrderFunction);
    stampExistingOrders();
    renderCommercialSyncPanel();
    renderDeploymentConfigV1();
    if(firstBoot) writeSyncLog("init", "未连接", "商用同步底座已初始化，当前部署模式：" + deploymentModeLabel(meta().deploymentMode) + "。");
  }

  window.initCommercialSync = initCommercialSync;
  window.renderCommercialSyncPanel = renderCommercialSyncPanel;
  window.getMerchantScopedData = getMerchantScopedData;
  window.buildCloudPayload = buildCloudPayload;
  window.buildBusinessSnapshot = buildBusinessSnapshot;
  window.pushBusinessSnapshot = pushBusinessSnapshot;
  window.pushLatestOrderToCloud = pushLatestOrderToCloud;
  window.readCloudOrders = readCloudOrders;
  window.mergeCloudOrdersToLocal = mergeCloudOrdersToLocal;
  window.pushEmployeesToCloud = pushEmployeesToCloud;
  window.readCloudEmployees = readCloudEmployees;
  window.mergeCloudEmployeesToLocal = mergeCloudEmployeesToLocal;
  window.pushInventorySnapshotToCloud = pushInventorySnapshotToCloud;
  window.readCloudInventory = readCloudInventory;
  window.mergeCloudInventoryToLocal = mergeCloudInventoryToLocal;
  window.readBusinessSnapshot = readBusinessSnapshot;
  window.readLatestBusinessSnapshot = readLatestBusinessSnapshot;
  window.restoreLatestBusinessSnapshotSafely = restoreLatestBusinessSnapshotSafely;
  window.checkOrderSyncConsole = checkOrderSyncConsole;
  window.checkInventorySyncConsole = checkInventorySyncConsole;
  window.checkEmployeeSyncConsole = checkEmployeeSyncConsole;
  window.checkSnapshotSyncConsole = checkSnapshotSyncConsole;
  window.checkAllSyncConsole = checkAllSyncConsole;
  window.runSyncHealthCheck = runSyncHealthCheck;
  window.clearSyncConsoleErrors = clearSyncConsoleErrors;
  window.runRlsCommercialPrecheck = runRlsCommercialPrecheck;
  window.generateRlsPreEnableBackup = generateRlsPreEnableBackup;
  window.getCurrentMerchantId = getCurrentMerchantId;
  window.canUseCloudSync = canUseCloudSync;
  window.updateCloudSyncButtonsV1 = updateCloudSyncButtonsV1;
  window.renderDeploymentConfigV1 = renderDeploymentConfigV1;
  window.saveDeploymentConfigV1 = saveDeploymentConfigV1;
  window.togglePrivateDeploymentFieldsV1 = togglePrivateDeploymentFieldsV1;
  window.focusDeploymentConfigV1 = focusDeploymentConfigV1;
  window.getDeploymentConfigV1 = deploymentConfig;
  window.createRuntimeSupabaseClient = createRuntimeSupabaseClient;
  window.testDeploymentSupabaseConnectionV1 = testDeploymentSupabaseConnectionV1;
  window.toggleAutoSyncEnabled = toggleAutoSyncEnabled;
  window.pullCloudSnapshot = pullCloudSnapshot;
  window.pushLocalChanges = pushLocalChanges;
  window.resolveSyncConflict = resolveSyncConflict;
  window.writeSyncLog = writeSyncLog;
  window.updateSyncStatus = updateSyncStatus;
  window.initSupabaseClient = initSupabaseClient;
  window.testConnection = testConnection;
  window.testInsert = testInsert;
  window.testReadCloud = testReadCloud;

  document.addEventListener("change", function(ev){
    var el = ev.target;
    if(el && el.id === "autoSyncEnabledV1"){
      toggleAutoSyncEnabled(el.checked === true);
      return;
    }
    if(el && el.matches && el.matches("input,select,textarea")) setTimeout(markDataUpdated, 0);
  }, true);
  document.addEventListener("click", function(ev){
    var testBtn = ev.target && ev.target.closest ? ev.target.closest("#testCloudConnectionV1") : null;
    if(testBtn){
      ev.preventDefault();
      testConnection();
      return;
    }
    var insertBtn = ev.target && ev.target.closest ? ev.target.closest("#testCloudInsertV1") : null;
    if(insertBtn){
      ev.preventDefault();
      testInsert();
      return;
    }
    var readBtn = ev.target && ev.target.closest ? ev.target.closest("#testCloudReadV1") : null;
    if(readBtn){
      ev.preventDefault();
      testReadCloud();
      return;
    }
    var pushSnapshotBtn = ev.target && ev.target.closest ? ev.target.closest("#pushBusinessSnapshotV1") : null;
    if(pushSnapshotBtn){
      ev.preventDefault();
      pushBusinessSnapshot();
      return;
    }
    var readSnapshotBtn = ev.target && ev.target.closest ? ev.target.closest("#readBusinessSnapshotV1") : null;
    if(readSnapshotBtn){
      ev.preventDefault();
      readBusinessSnapshot();
      return;
    }
    var readLatestSnapshotBtn = ev.target && ev.target.closest ? ev.target.closest("#readLatestBusinessSnapshotV1") : null;
    if(readLatestSnapshotBtn){
      ev.preventDefault();
      readLatestBusinessSnapshot();
      return;
    }
    var restoreSnapshotBtn = ev.target && ev.target.closest ? ev.target.closest("#restoreBusinessSnapshotV1") : null;
    if(restoreSnapshotBtn){
      ev.preventDefault();
      restoreLatestBusinessSnapshotSafely();
      return;
    }
    if(ev.target && ev.target.closest && ev.target.closest("#profileCenterRootV92")) setTimeout(renderCommercialSyncPanel, 0);
  }, true);
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", initCommercialSync);
  else initCommercialSync();
  setTimeout(initCommercialSync, 600);
})();

/* extracted script block 67 */
/* ===== 统一左侧导航单击行为：先于旧 document 捕获处理，避免首次点击只选中 ===== */
(function(){
  if(window.__cangjieUnifiedNavClickV1) return;
  window.__cangjieUnifiedNavClickV1 = true;
  var lastAt = 0;
  var lastPage = "";

  function normalizeNavPage(page){
    page = String(page || "").trim();
    if(page === "inventory") return "inventoryStep1";
    if(page === "owner" || page === "owners") return "ownersStep1";
    if(page === "config" || page === "settings" || page === "connection") return "configStep1";
    if(page === "profile" || page === "personalCenter") return "profileV92";
    return page || "cashier";
  }
  function pageFromButton(btn){
    if(!btn) return "";
    return normalizeNavPage(btn.getAttribute("data-page") || (btn.getAttribute("data-config-direct") === "1" ? "configStep1" : ""));
  }
  function setImmediateActive(page){
    var nav = document.getElementById("globalUnifiedNavV41");
    if(!nav) return;
    page = normalizeNavPage(page);
    Array.from(nav.querySelectorAll(".v41-nav-btn")).forEach(function(btn){
      btn.classList.toggle("active", pageFromButton(btn) === page);
    });
  }
  function route(page){
    page = normalizeNavPage(page);
    setImmediateActive(page);
    if(page === "buyers" && typeof window.openBuyerManagerV47 === "function"){
      window.openBuyerManagerV47();
      return;
    }
    if(page === "reports" && typeof window.openReportsStep1 === "function"){
      window.openReportsStep1();
      return;
    }
    if(page === "profileV92" && typeof window.showProfileCenterV92 === "function"){
      window.showProfileCenterV92();
      return;
    }
    if(typeof window.showAppPage === "function"){
      window.showAppPage(page);
    }
  }
  function handleNavEvent(ev){
    var btn = ev.target && ev.target.closest ? ev.target.closest("#globalUnifiedNavV41 .v41-nav-btn") : null;
    if(!btn) return;
    var page = pageFromButton(btn);
    if(!page) return;
    var now = Date.now();
    if(ev.type === "click" && lastPage === page && now - lastAt < 450){
      ev.preventDefault();
      ev.stopPropagation();
      if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      return false;
    }
    lastAt = now;
    lastPage = page;
    ev.preventDefault();
    ev.stopPropagation();
    if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    route(page);
    return false;
  }
  ["pointerdown","touchstart","mousedown","click"].forEach(function(type){
    window.addEventListener(type, handleNavEvent, true);
  });
})();

/* extracted script block 68 */
/* ===== 客户测试版入口页：本地模拟登录，不连接数据库 ===== */
(function(){
  var LOGIN_KEY = "cangjieMerchantLoginV92";
  var ACCOUNT_KEY = "cangjieCurrentAccountV94";
  var DEFAULT_PAGE = "cashier";

  function readJSON(key, fallback){
    try{
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    }catch(err){
      return fallback;
    }
  }
  function writeJSON(key, value){
    try{ localStorage.setItem(key, JSON.stringify(value)); }catch(err){}
  }
  function login(){
    return readJSON(LOGIN_KEY, {}) || {};
  }
  function stableId(value){
    var text = String(value || "customer");
    var h = 0;
    for(var i=0;i<text.length;i++){
      h = ((h << 5) - h) + text.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h).toString(36).padStart(6, "0");
  }
  function isLoggedIn(){
    var row = login();
    return row && row.loggedIn === true && !!(row.phone || row.wechat);
  }
  function status(text){
    var el = document.getElementById("merchantEntryStatusV1");
    if(el) el.textContent = text || "";
  }
  function lockEntry(text){
    if(document.body) document.body.classList.add("merchant-entry-locked-v1");
    status(text || "未登录");
    setTimeout(function(){
      var input = document.getElementById("merchantEntryPhoneV1");
      if(input) input.focus();
    }, 0);
  }
  function unlockEntry(text){
    if(document.body) document.body.classList.remove("merchant-entry-locked-v1");
    status(text || "已登录");
  }
  function ensureDefaultAccount(phone){
    writeJSON(ACCOUNT_KEY, {
      id:"owner",
      employee_id:"owner",
      employee_name:"主账号",
      role:"owner",
      name:"主账号",
      phone:phone || "",
      wechat:"",
      status:"启用",
      permissions:["收银","批次","库存","订单","货主","买家管理","报表","配置","个人中心"],
      authorized:true
    });
  }
  function applyMerchantProfileForTest(phone){
    writeJSON("cangjieMerchantProfileV92", {
      title:"仓颉",
      name:"测试商户",
      address:"测试地址",
      phone:phone
    });
  }
  window.createCustomerTestLoginV1 = function(phone){
    phone = String(phone || "").trim();
    var merchantId = "mch_test_" + stableId(phone);
    var time = new Date().toLocaleString("zh-CN", {hour12:false});
    writeJSON(LOGIN_KEY, {
      loggedIn:true,
      mode:"phone",
      phone:phone,
      wechat:"",
      time:time,
      localMock:true,
      customerTest:true,
      merchantId:merchantId
    });
    ensureDefaultAccount(phone);
    writeJSON("cangjieCurrentAccountV93", {
      id:"owner",
      role:"owner",
      name:"主账号",
      phone:phone,
      wechat:"",
      status:"启用",
      authorized:true
    });
    writeJSON("cangjieAdminAccountV93", {
      id:"owner",
      role:"owner",
      name:"主账号",
      phone:phone,
      wechat:"",
      status:"启用"
    });
    applyMerchantProfileForTest(phone);
    var meta = readJSON("cangjieCommercialSyncV1", {}) || {};
    meta.merchantId = merchantId;
    meta.userId = "owner";
    meta.role = "owner";
    meta.currentPhone = phone;
    meta.dataUpdatedAt = new Date().toISOString();
    meta.offlineAvailable = true;
    meta.customerTestLogin = true;
    writeJSON("cangjieCommercialSyncV1", meta);
    return {merchantId:merchantId, phone:phone};
  };
  function showDefaultPage(){
    var oldShow = window.__merchantEntryOldShowAppPageV1 || window.showAppPage;
    if(typeof oldShow === "function") oldShow.call(window, DEFAULT_PAGE);
  }

  window.loginMerchantEntryPhoneV1 = async function(){
    var input = document.getElementById("merchantEntryPhoneV1");
    var phone = input ? String(input.value || "").trim() : "";
    if(!phone){
      status("请输入手机号后再登录");
      if(input) input.focus();
      return;
    }
    window.createCustomerTestLoginV1(phone);
    if(typeof window.renderProfileV92 === "function") try{ window.renderProfileV92(); }catch(err){}
    unlockEntry("手机号已登录");
    setTimeout(showDefaultPage, 0);
  };

  window.merchantEntryWechatPlaceholderV1 = function(){
    status("微信登录即将接入，请先使用手机号登录");
  };

  window.enterMerchantAppForTestV1 = function(){
    var phone = "13800000000";
    var input = document.getElementById("merchantEntryPhoneV1");
    if(input) input.value = phone;
    window.createCustomerTestLoginV1(phone);
    ensureDefaultAccount(phone);
    applyMerchantProfileForTest(phone);
    if(typeof window.renderProfileV92 === "function") try{ window.renderProfileV92(); }catch(err){}
    unlockEntry("测试商户已登录");
    setTimeout(showDefaultPage, 0);
  };

  window.enterMerchantAppV1 = function(){
    if(!isLoggedIn()){
      lockEntry("请先完成手机号登录");
      return;
    }
    unlockEntry("已进入系统");
    showDefaultPage();
  };

  function installGuard(){
    if(window.showAppPage && !window.showAppPage.__merchantEntryGuardV1){
      window.__merchantEntryOldShowAppPageV1 = window.showAppPage;
      window.showAppPage = function(page){
        if(!isLoggedIn()){
          lockEntry("请先登录后进入系统");
          return undefined;
        }
        unlockEntry("已登录");
        return window.__merchantEntryOldShowAppPageV1.apply(this, arguments);
      };
      window.showAppPage.__merchantEntryGuardV1 = true;
    }
  }
  function boot(){
    installGuard();
    var input = document.getElementById("merchantEntryPhoneV1");
    if(input && !input.__merchantEntryEnterV1){
      input.addEventListener("keydown", function(ev){
        if(ev.key === "Enter") window.loginMerchantEntryPhoneV1();
      });
      input.__merchantEntryEnterV1 = true;
    }
    if(isLoggedIn()){
      unlockEntry("已登录");
      setTimeout(showDefaultPage, 0);
    }else{
      lockEntry("未登录");
    }
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  setTimeout(boot, 800);
})();

/* extracted script block 69 */
/* ===== V107：收银台下单确认弹窗，承接优惠/支付/备注 ===== */
(function(){
  if(window.__cangjieCheckoutConfirmModalV107) return;
  window.__cangjieCheckoutConfirmModalV107 = true;

  var paymentLabels = {
    cash:"现金",
    wechat:"微信",
    alipay:"支付宝",
    bank:"银行卡",
    debt:"赊欠"
  };
  var checkoutDraft = {
    discount:0,
    preset:"none",
    payment:"cash",
    paid:"",
    paidTouched:false,
    remark:"",
    lastDue:0
  };
  if(!window.currentPaymentMethod) window.currentPaymentMethod = "cash";
  var finalizeOrderV107 = typeof window.confirmOrderFromCodeBill === "function"
    ? window.confirmOrderFromCodeBill
    : null;
  var buildCodeBillV107 = typeof window.buildCodeBill === "function"
    ? window.buildCodeBill
    : null;

  function num(v){
    var n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  function moneyText(v){
    return typeof window.money === "function" ? window.money(v || 0) : Number(v || 0).toFixed(2);
  }
  function esc(v){
    if(typeof window.esc === "function") return window.esc(v);
    return String(v == null ? "" : v)
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;");
  }
  function syncCurrentPaymentMethodV107(method){
    var next = String(method || "cash");
    if(typeof window.setCurrentPaymentMethodV121 === "function") return window.setCurrentPaymentMethodV121(next);
    window.currentPaymentMethod = next;
    return next;
  }
  function cloneCheckoutRowsV115(rows){
    return (Array.isArray(rows) ? rows : []).map(function(item){ return Object.assign({}, item); });
  }
  function currentCodeBillRowsV107(){
    try{
      if(typeof currentCodeBillItems !== "undefined" && Array.isArray(currentCodeBillItems) && currentCodeBillItems.length) return currentCodeBillItems;
    }catch(err){}
    if(Array.isArray(window.currentCodeBillItems) && window.currentCodeBillItems.length) return window.currentCodeBillItems;
    return Array.isArray(window.checkoutCartSnapshotV115) ? window.checkoutCartSnapshotV115 : [];
  }
  function currentOriginalAmount(){
    var rows = currentCodeBillRowsV107();
    return typeof window.getOrderOriginalAmount === "function"
      ? num(window.getOrderOriginalAmount())
      : rows.reduce(function(sum, item){
          return sum + (typeof window.lineAmount === "function" ? num(window.lineAmount(item)) : 0);
        }, 0);
  }
  function currentTotals(){
    var rows = currentCodeBillRowsV107();
    var totalQty = rows.reduce(function(s, i){ return s + num(i && i.qty); }, 0);
    var totalWeight = rows.reduce(function(s, i){ return s + num(i && i.weight); }, 0);
    return {
      goodsCount:rows.length,
      totalQty:totalQty,
      totalWeight:totalWeight,
      originalAmount:currentOriginalAmount()
    };
  }
  function activeCustomerV107(){
    try{
      if(typeof window.activeCashierCustomer === "function") return window.activeCashierCustomer();
    }catch(err){}
    return {id:"c1", name:"临时客户"};
  }
  function currentUserV107(){
    try{
      if(typeof window.getCurrentUserV96 === "function") return window.getCurrentUserV96() || {};
    }catch(err){}
    try{
      return JSON.parse(localStorage.getItem("currentUser") || localStorage.getItem("cangjieCurrentAccountV93") || "{}") || {};
    }catch(err){}
    return {};
  }
  function merchantProfileV107(){
    try{
      if(typeof window.merchantProfile === "function") return window.merchantProfile() || {};
    }catch(err){}
    try{
      return JSON.parse(localStorage.getItem("cangjieMerchantProfileV92") || "{}") || {};
    }catch(err){}
    return {};
  }
  function normalizeDraft(){
    var totals = currentTotals();
    var original = totals.originalAmount;
    var discount = Math.max(num(checkoutDraft.discount), 0);
    if(discount > original) discount = original;
    checkoutDraft.discount = discount;

    var due = Math.max(original - discount, 0);
    var paid = checkoutDraft.paid === "" ? due : num(checkoutDraft.paid);
    var shouldFollowDue = !checkoutDraft.paidTouched || Math.abs(num(checkoutDraft.lastDue) - num(checkoutDraft.paid)) < 0.001;
    if(shouldFollowDue){
      paid = due;
      checkoutDraft.paidTouched = false;
    }
    if(paid < 0) paid = 0;
    if(paid > due) paid = due;
    checkoutDraft.paid = paid;
    checkoutDraft.lastDue = due;
    return {
      goodsCount:totals.goodsCount,
      totalQty:totals.totalQty,
      totalWeight:totals.totalWeight,
      originalAmount:original,
      discount:discount,
      totalAmount:due,
      paid:paid,
      debt:Math.max(due - paid, 0),
      payment:checkoutDraft.payment || "cash",
      paymentLabel:paymentLabels[checkoutDraft.payment || "cash"] || "现金",
      remark:String(checkoutDraft.remark || "").trim()
    };
  }
  function syncLegacyFields(payload){
    var discountInput = document.getElementById("cashierDiscountAmount");
    if(discountInput) discountInput.value = payload.discount ? String(payload.discount) : "";
    var discountNote = document.getElementById("cashierDiscountNote");
    if(discountNote) discountNote.value = "";
    var paidInput = document.getElementById("cashierPaidAmount");
    if(paidInput) paidInput.value = String(payload.paid);
    var payMode = document.getElementById("cashierPayMode");
    if(payMode){
      if(payload.debt <= 0){
        payMode.value = "cash";
      }else if(payload.paid <= 0){
        payMode.value = "debt";
      }else{
        payMode.value = "mixed";
      }
    }
    var remarkInput = document.getElementById("cashierOrderRemarkStep1");
    if(remarkInput) remarkInput.value = payload.remark || "";
  }
  function ensureModalDom(){
    if(document.getElementById("checkoutConfirmMaskV107")) return;
    var wrap = document.createElement("div");
    wrap.innerHTML =
      '<div class="checkout-confirm-mask-v107" id="checkoutConfirmMaskV107">'
      + '<div class="checkout-confirm-modal-v107" role="dialog" aria-modal="true" aria-labelledby="checkoutConfirmTitleV107">'
      + '<div class="checkout-confirm-head-v107"><button class="checkout-confirm-close-v107" type="button" onclick="closeCheckoutConfirmModalV107()">×</button><h2 id="checkoutConfirmTitleV107">确认下单</h2><button class="checkout-switch-customer-v107" type="button" onclick="focusCheckoutCustomerV107()">切换客户</button></div>'
      + '<div class="checkout-confirm-body-v107">'
      + '<div class="checkout-confirm-customer-v107">客户：<b id="checkoutConfirmCustomerV107">临时客户</b><span id="checkoutCustomerTypeV107">（临时客户）</span></div>'
      + '<div class="checkout-confirm-grid-v107"><div class="checkout-confirm-left-v107">'
      + '<section class="checkout-confirm-section-v107 checkout-amount-section-v107"><h3>金额信息</h3><div class="checkout-amount-row-v107"><span>原始应收</span><b id="checkoutConfirmOriginalV107">¥0.00</b></div><div class="checkout-discount-row-v107"><span>优惠金额</span><div class="checkout-money-input-v107"><em>¥</em><input id="checkoutDiscountInputV107" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.00"><strong id="checkoutDiscountValueV107">0.00</strong></div></div><div class="checkout-due-v107"><span>优惠后应收</span><b id="checkoutDueAmountV107">¥0.00</b></div></section>'
      + '<section class="checkout-confirm-section-v107"><h3>实收金额</h3><div class="checkout-money-input-v107"><em>¥</em><input id="checkoutPaidInputV107" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.00"><strong id="checkoutPaidValueV107">0.00</strong></div><div class="checkout-helper-v107" id="checkoutDebtHintV107"></div></section>'
      + '<section class="checkout-confirm-section-v107"><h3>支付方式</h3><div class="checkout-chip-row-v107" id="checkoutPaymentMethodsV107"></div></section>'
      + '</div><aside class="checkout-side-v107"><div class="checkout-keypad-v107" aria-label="数字键盘"><button type="button" data-keypad-v107="7">7</button><button type="button" data-keypad-v107="8">8</button><button type="button" data-keypad-v107="9">9</button><button type="button" data-keypad-v107="back">⌫</button><button type="button" data-keypad-v107="4">4</button><button type="button" data-keypad-v107="5">5</button><button type="button" data-keypad-v107="6">6</button><button type="button" data-keypad-v107="plus">+</button><button type="button" data-keypad-v107="1">1</button><button type="button" data-keypad-v107="2">2</button><button type="button" data-keypad-v107="3">3</button><button type="button" data-keypad-v107="minus">−</button><button type="button" class="wide" data-keypad-v107="0">0</button><button type="button" data-keypad-v107=".">.</button><button type="button" data-keypad-v107="00">00</button></div><section class="checkout-confirm-section-v107 checkout-remark-section-v107"><h3>订单备注</h3><textarea id="checkoutRemarkInputV107" class="checkout-textarea-v107" maxlength="100" placeholder="请输入备注信息，如少收、客户说明、特殊价格原因等..."></textarea></section></aside></div>'
      + '<div class="checkout-confirm-actions-v107"><button class="checkout-confirm-cancel-v107" type="button" onclick="submitDebtCheckoutConfirmModalV107()">赊欠</button><button class="checkout-confirm-submit-v107" type="button" onclick="submitCheckoutConfirmModalV107()">收银</button></div>'
      + '</div></div></div>';
    document.body.appendChild(wrap.firstChild);

    document.getElementById("checkoutConfirmMaskV107").addEventListener("click", function(ev){
      if(ev.target === this) window.closeCheckoutConfirmModalV107();
    });
    document.getElementById("checkoutDiscountInputV107").addEventListener("input", function(){
      checkoutDraft.discount = this.value;
      renderModalV107();
    });
    document.getElementById("checkoutDiscountInputV107").addEventListener("focus", function(){
      window.checkoutActiveAmountInputV107 = "discount";
    });
    document.getElementById("checkoutPaidInputV107").addEventListener("input", function(){
      checkoutDraft.paid = this.value;
      checkoutDraft.paidTouched = true;
      renderModalV107();
    });
    document.getElementById("checkoutPaidInputV107").addEventListener("focus", function(){
      window.checkoutActiveAmountInputV107 = "paid";
    });
    document.getElementById("checkoutRemarkInputV107").addEventListener("input", function(){
      checkoutDraft.remark = this.value || "";
      syncLegacyFields(normalizeDraft());
    });
    document.getElementById("checkoutConfirmMaskV107").addEventListener("click", function(ev){
      var key = ev.target && ev.target.getAttribute ? ev.target.getAttribute("data-keypad-v107") : "";
      if(!key) return;
      ev.preventDefault();
      applyCheckoutKeypadV107(key);
    });
    document.getElementById("checkoutConfirmMaskV107").addEventListener("click", function(ev){
      var method = ev.target && ev.target.getAttribute ? ev.target.getAttribute("data-payment-v107") : "";
      if(!method) return;
      ev.preventDefault();
      chooseCheckoutPaymentMethodV107(method);
    });
    var submitBtnV107 = document.querySelector(".checkout-confirm-submit-v107");
    if(submitBtnV107 && !submitBtnV107.__boundV107){
      submitBtnV107.addEventListener("click", function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        window.submitCheckoutConfirmModalV107();
      });
      submitBtnV107.__boundV107 = true;
    }
    var debtBtnV107 = document.querySelector(".checkout-confirm-cancel-v107");
    if(debtBtnV107 && !debtBtnV107.__boundV107){
      debtBtnV107.addEventListener("click", function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        window.submitDebtCheckoutConfirmModalV107();
      });
      debtBtnV107.__boundV107 = true;
    }
  }
  function renderPaymentMethods(activePayment){
    var box = document.getElementById("checkoutPaymentMethodsV107");
    if(!box) return;
    var temp = typeof window.isTemporaryCashierCustomer === "function" ? window.isTemporaryCashierCustomer() : ((activeCustomerV107() || {}).id === "c1");
    box.innerHTML = Object.keys(paymentLabels).map(function(key){
      var disabled = key === "debt" && temp;
      return '<button type="button" data-payment-v107="' + key + '" class="checkout-chip-v107' + (activePayment === key ? ' active' : '') + '" ' + (disabled ? 'disabled aria-disabled="true"' : '') + '>' + paymentLabels[key] + '</button>';
    }).join("");
  }
  function renderModalV107(){
    var payload = normalizeDraft();
    syncLegacyFields(payload);

    var customer = activeCustomerV107() || {name:"临时客户"};
    var customerName = customer.name || "临时客户";
    var isTempCustomer = typeof window.isTemporaryCashierCustomer === "function" ? window.isTemporaryCashierCustomer() : (customer.id === "c1" || customerName === "临时客户");
    document.getElementById("checkoutConfirmCustomerV107").textContent = customerName;
    document.getElementById("checkoutCustomerTypeV107").textContent = isTempCustomer ? "（临时客户）" : "（可赊欠客户）";
    document.getElementById("checkoutConfirmOriginalV107").textContent = "¥" + moneyText(payload.originalAmount);
    document.getElementById("checkoutDiscountInputV107").value = payload.discount ? String(payload.discount) : "";
    document.getElementById("checkoutDiscountValueV107").textContent = payload.discount.toFixed(2);
    document.getElementById("checkoutDueAmountV107").textContent = "¥" + moneyText(payload.totalAmount);
    document.getElementById("checkoutPaidInputV107").value = payload.paid === 0 && payload.totalAmount !== 0 ? "" : String(payload.paid);
    document.getElementById("checkoutPaidValueV107").textContent = payload.paid.toFixed(2);
    document.getElementById("checkoutRemarkInputV107").value = checkoutDraft.remark || "";
    document.getElementById("checkoutDebtHintV107").textContent = payload.debt > 0 ? ("当前仍有未收金额：¥" + moneyText(payload.debt)) : "当前实收金额将按确认内容保存到订单";
    renderPaymentMethods(payload.payment);
  }
  window.renderModalV107 = renderModalV107;
  function loadDraftFromLegacy(){
    var original = currentOriginalAmount();
    var discount = Math.max(num(document.getElementById("cashierDiscountAmount") && document.getElementById("cashierDiscountAmount").value), 0);
    if(discount > original) discount = original;
    var paidRaw = document.getElementById("cashierPaidAmount") ? document.getElementById("cashierPaidAmount").value : "";
    checkoutDraft.discount = discount;
    checkoutDraft.payment = syncCurrentPaymentMethodV107(window.currentPaymentMethod || checkoutDraft.payment || "cash");
    checkoutDraft.paidTouched = !!String(paidRaw || "").trim();
    checkoutDraft.paid = checkoutDraft.paidTouched ? num(paidRaw) : Math.max(original - discount, 0);
    checkoutDraft.remark = (document.getElementById("cashierOrderRemarkStep1") && document.getElementById("cashierOrderRemarkStep1").value) || checkoutDraft.remark || "";
    checkoutDraft.lastDue = Math.max(original - discount, 0);
  }
  function getCheckoutPayloadV107(){
    var payload = normalizeDraft();
    var user = currentUserV107();
    var merchant = merchantProfileV107();
    payload.customerName = (activeCustomerV107() || {}).name || "临时客户";
    payload.customerId = (activeCustomerV107() || {}).id || "c1";
    payload.paymentMethod = payload.payment;
    payload.paymentMethodLabel = paymentLabels[payload.payment] || "现金";
    payload.cashierName = user.employee_name || user.name || (user.role === "owner" ? "主账号" : "");
    payload.cashierPhone = user.phone || "";
    payload.cashierRole = user.role || "";
    payload.employee_id = user.employee_id || user.employeeId || user.id || "";
    payload.employee_name = payload.cashierName;
    payload.employeeRole = payload.cashierRole;
    payload.merchantName = merchant.name || merchant.title || "仓颉";
    payload.merchantAddress = merchant.address || "";
    payload.merchantPhone = merchant.phone || "";
    return payload;
  }

  window.chooseCheckoutPaymentMethodV107 = function(method){
    var isTemp = typeof window.isTemporaryCashierCustomer === "function"
      ? window.isTemporaryCashierCustomer()
      : ((activeCustomerV107() || {}).id === "c1");
    if(method === "debt" && isTemp){
      if(typeof window.toast === "function") window.toast("临时客户不能选择赊欠");
      checkoutDraft.payment = "cash";
      renderModalV107();
      return;
    }
    checkoutDraft.payment = method || "cash";
    syncCurrentPaymentMethodV107(checkoutDraft.payment);
    if(checkoutDraft.payment === "debt"){
      checkoutDraft.paid = 0;
      checkoutDraft.paidTouched = true;
    }else{
      checkoutDraft.paidTouched = false;
    }
    renderModalV107();
  };
  window.focusCheckoutCustomerV107 = function(){
    window.closeCheckoutConfirmModalV107();
    var customer = document.getElementById("cashierCustomer");
    if(customer){
      customer.focus();
      if(typeof window.toast === "function") window.toast("请在右侧客户栏切换客户后再下单");
    }
  };
  function applyCheckoutKeypadV107(key){
    var targetName = window.checkoutActiveAmountInputV107 || "paid";
    var input = document.getElementById(targetName === "discount" ? "checkoutDiscountInputV107" : "checkoutPaidInputV107");
    if(!input) return;
    var value = String(input.value || "");
    if(key === "back"){
      value = value.slice(0, -1);
    }else if(key === "plus" || key === "minus"){
      var next = num(value) + (key === "plus" ? 1 : -1);
      value = String(Math.max(next, 0));
    }else if(key === "."){
      if(value.indexOf(".") < 0) value = value ? value + "." : "0.";
    }else{
      value += key;
    }
    if(value.indexOf(".") >= 0){
      var parts = value.split(".");
      value = parts[0] + "." + parts.slice(1).join("").slice(0, 2);
    }
    input.value = value;
    if(targetName === "discount"){
      checkoutDraft.discount = value;
    }else{
      checkoutDraft.paid = value;
      checkoutDraft.paidTouched = true;
    }
    renderModalV107();
    input.focus();
  }
  function restoreCheckoutRowsV115(){
    var currentRows = [];
    try{ currentRows = (typeof currentCodeBillItems !== "undefined" && Array.isArray(currentCodeBillItems)) ? currentCodeBillItems : []; }catch(err){}
    if(currentRows.length) return currentRows;
    var snapshot = Array.isArray(window.checkoutCartSnapshotV115) ? window.checkoutCartSnapshotV115 : [];
    if(!snapshot.length) return currentRows;
    try{ currentCodeBillItems = cloneCheckoutRowsV115(snapshot); }catch(err){}
    try{ window.currentCodeBillItems = currentCodeBillItems; }catch(err){}
    return Array.isArray(currentCodeBillItems) ? currentCodeBillItems : snapshot;
  }
  window.openCheckoutConfirmModalV107 = function(){
    var rows = currentCodeBillRowsV107();
    if(!rows.length){
      alert("请先选择商品。");
      return;
    }
    window.checkoutCartSnapshotV115 = cloneCheckoutRowsV115(rows);
    ensureModalDom();
    loadDraftFromLegacy();
    renderModalV107();
    document.getElementById("checkoutConfirmMaskV107").classList.add("show");
  };
  window.closeCheckoutConfirmModalV107 = function(){
    var mask = document.getElementById("checkoutConfirmMaskV107");
    if(mask) mask.classList.remove("show");
  };
  function resetCheckoutDraftAfterSubmitV107(){
    checkoutDraft.discount = 0;
    checkoutDraft.payment = "cash";
    checkoutDraft.paid = "";
    checkoutDraft.paidTouched = false;
    checkoutDraft.remark = "";
    syncCurrentPaymentMethodV107("cash");
  }
  function directFinalizeCheckoutOrderV107(){
    var liveRows = restoreCheckoutRowsV115();
    if(!liveRows.length){
      alert("请先选择商品。");
      return false;
    }
    var bill = typeof window.buildCodeBill === "function" ? window.buildCodeBill() : null;
    if(!bill) return false;
    var customerList = (typeof cashierCustomers !== "undefined" && Array.isArray(cashierCustomers)) ? cashierCustomers : [];
    var customer = customerList.find(function(c){ return c && c.id === bill.customerId; });
    var isTemp = typeof window.isTemporaryCashierCustomer === "function" ? window.isTemporaryCashierCustomer() : false;
    if(customer && !isTemp){
      customer.debt = Number(customer.debt || 0) + Number(bill.debt || 0);
    }
    currentCodeBillItems.forEach(function(line){
      var need = Number(line.qty || 0);
      (Array.isArray(batches) ? batches : []).forEach(function(batch){
        (Array.isArray(batch.items) ? batch.items : []).forEach(function(item){
          if(item.goodsId === line.goodsId && need > 0){
            var available = Number(item.qty || 0) - Number(item.sold || 0);
            var take = Math.min(Math.max(available, 0), need);
            item.sold = Number(item.sold || 0) + take;
            need -= take;
          }
        });
      });
    });
    if(typeof window.pushCompletedOrder === "function") window.pushCompletedOrder(bill);
    else{
      if(!bill.orderNo){
        bill.orderNo = typeof window.makeShortOrderNo === "function" ? window.makeShortOrderNo() : String(((window.finalOrders || []).length || 0) + 1).padStart(4, "0");
      }
      bill.status = Number(bill.debt || 0) > 0 ? "已赊欠" : "已收银";
      window.finalOrders = Array.isArray(window.finalOrders) ? window.finalOrders : [];
      window.finalOrders.unshift(bill);
    }
    if(typeof window.removePendingDuplicateOrders === "function") window.removePendingDuplicateOrders(bill);
    if(typeof savedCodeBills !== "undefined" && Array.isArray(savedCodeBills)) savedCodeBills.unshift(bill);
    if(typeof selectedBillCenterId !== "undefined") selectedBillCenterId = bill.billNo;
    currentCodeBillItems = [];
    try{ window.currentCodeBillItems = currentCodeBillItems; }catch(err){}
    try{ window.checkoutCartSnapshotV115 = []; }catch(err){}
    try{ window.__cashierCartClearedV116 = true; }catch(err){}
    try{
      var sessionRowsV107 = Array.isArray(window.cashierBillSessionsStep1) ? window.cashierBillSessionsStep1 : [];
      if(sessionRowsV107.length){
        var activeTabV107 = document.querySelector('#cashierRoot .order-tab.active[data-bill-session]');
        var activeSessionIdV107 = activeTabV107 ? activeTabV107.getAttribute('data-bill-session') : '';
        sessionRowsV107.forEach(function(session){
          if(!session) return;
          if(!activeSessionIdV107 || session.id === activeSessionIdV107 || Array.isArray(session.items)){
            session.items = [];
            session.__cartClearedV116 = true;
            session.__completedV116 = true;
          }
        });
      }
    }catch(err){}
    var paidInput = document.getElementById("cashierPaidAmount");
    if(paidInput) paidInput.value = "";
    try{ if(typeof window.clearCashierDiscountFields === "function") window.clearCashierDiscountFields(); }catch(err){}
    try{ var discountInput = document.getElementById("cashierDiscountAmount"); if(discountInput) discountInput.value = ""; }catch(err){}
    try{ var discountNote = document.getElementById("cashierDiscountNote"); if(discountNote) discountNote.value = ""; }catch(err){}
    try{ if(typeof window.closeCodeBillModal === "function") window.closeCodeBillModal(); }catch(err){}
    try{ if(typeof window.renderCashierAll === "function") window.renderCashierAll(); }catch(err){}
    try{ if(typeof window.renderGoods === "function") window.renderGoods(); }catch(err){}
    try{ if(typeof window.renderDetail === "function") window.renderDetail(); }catch(err){}
    try{ if(typeof window.renderOrdersCenter === "function") window.renderOrdersCenter(); }catch(err){}
    try{ if(typeof window.renderBillCenter === "function") window.renderBillCenter(); }catch(err){}
    try{ if(typeof window.renderCodeBillHistory === "function") window.renderCodeBillHistory(); }catch(err){}
    try{ if(typeof window.renderStockModule === "function") window.renderStockModule(); }catch(err){}
    try{ if(typeof window.tudou2SaveNow === "function") setTimeout(window.tudou2SaveNow, 0); }catch(err){}
    if(typeof window.toast === "function") window.toast("订单 " + (bill.orderNo || bill.billNo || "") + " 已完成");
    return true;
  }
  function finalizeCheckoutWithPayloadV107(payload){
    syncLegacyFields(payload);
    restoreCheckoutRowsV115();
    var beforeRows = currentCodeBillRowsV107().length;
    var beforeOrders = (typeof finalOrders !== "undefined" && Array.isArray(finalOrders)) ? finalOrders.length : 0;
    window.closeCheckoutConfirmModalV107();
    try{
      if(typeof finalizeOrderV107 === "function") finalizeOrderV107();
      else directFinalizeCheckoutOrderV107();
    }catch(err){
      try{ console.error("checkout finalize failed", err); }catch(e){}
      directFinalizeCheckoutOrderV107();
    }
    var afterRows = currentCodeBillRowsV107().length;
    var afterOrders = (typeof finalOrders !== "undefined" && Array.isArray(finalOrders)) ? finalOrders.length : 0;
    if(afterOrders === beforeOrders && afterRows === beforeRows && beforeRows > 0){
      directFinalizeCheckoutOrderV107();
    }
    try{ window.checkoutCartSnapshotV115 = []; }catch(err){}
    resetCheckoutDraftAfterSubmitV107();
  }
  window.submitCheckoutConfirmModalV107 = function(){
    var payload = normalizeDraft();
    if(payload.payment === "debt"){
      payload.payment = "cash";
      payload.paymentLabel = paymentLabels.cash || "现金";
      payload.paid = payload.totalAmount;
      payload.debt = 0;
      checkoutDraft.payment = "cash";
      checkoutDraft.paid = payload.totalAmount;
      checkoutDraft.paidTouched = false;
    }
    syncCurrentPaymentMethodV107(payload.payment || checkoutDraft.payment || "cash");
    if(typeof window.isTemporaryCashierCustomer === "function" && window.isTemporaryCashierCustomer() && payload.paid < payload.totalAmount){
      payload.paid = payload.totalAmount;
      payload.debt = 0;
      checkoutDraft.paid = payload.totalAmount;
      checkoutDraft.paidTouched = false;
      checkoutDraft.payment = "cash";
      if(typeof window.toast === "function") window.toast("临时客户必须当场结清，已自动修正为全额实收");
    }
    syncCurrentPaymentMethodV107(payload.payment || checkoutDraft.payment || "cash");
    finalizeCheckoutWithPayloadV107(payload);
  };
  window.submitDebtCheckoutConfirmModalV107 = function(){
    if(typeof window.isTemporaryCashierCustomer === "function" && window.isTemporaryCashierCustomer()){
      if(typeof window.toast === "function") window.toast("临时客户不可赊欠，请先切换正式客户");
      else alert("临时客户不可赊欠，请先切换正式客户");
      return;
    }
    var payload = normalizeDraft();
    payload.payment = "debt";
    payload.paymentLabel = paymentLabels.debt || "赊欠";
    payload.paid = 0;
    payload.debt = payload.totalAmount;
    checkoutDraft.payment = "debt";
    checkoutDraft.paid = 0;
    checkoutDraft.paidTouched = true;
    syncCurrentPaymentMethodV107("debt");
    finalizeCheckoutWithPayloadV107(payload);
  };

  if(typeof buildCodeBillV107 === "function"){
    window.buildCodeBill = function(){
      var bill = buildCodeBillV107.apply(this, arguments);
      var payload = getCheckoutPayloadV107();
      bill.discount = payload.discount;
      bill.totalAmount = payload.totalAmount;
      bill.paid = payload.paid;
      bill.paidAmount = payload.paid;
      bill.actualPaid = payload.paid;
      bill.debt = payload.debt;
      bill.paymentMethod = payload.paymentMethod;
      bill.paymentMethodLabel = payload.paymentMethodLabel;
      bill.orderRemark = payload.remark || bill.orderRemark || bill.remark || "";
      bill.remark = bill.orderRemark;
      bill.customerName = payload.customerName || bill.customerName;
      bill.customerId = payload.customerId || bill.customerId;
      bill.cashierName = payload.cashierName || bill.cashierName || "";
      bill.cashierPhone = payload.cashierPhone || bill.cashierPhone || "";
      bill.cashierRole = payload.cashierRole || bill.cashierRole || "";
      bill.employee_id = payload.employee_id || bill.employee_id || "";
      bill.employee_name = payload.employee_name || bill.employee_name || bill.cashierName || "";
      bill.employeeRole = payload.employeeRole || bill.employeeRole || bill.cashierRole || "";
      bill.merchantName = payload.merchantName || bill.merchantName || "";
      bill.merchantAddress = payload.merchantAddress || bill.merchantAddress || "";
      bill.merchantPhone = payload.merchantPhone || bill.merchantPhone || "";
      if(typeof bill.text === "string"){
        var lines = bill.text.split("\n").filter(Boolean);
        lines.push("支付方式：" + bill.paymentMethodLabel);
        lines.push("实收金额：" + moneyText(bill.paid));
        if(bill.debt > 0) lines.push("剩余欠款：" + moneyText(bill.debt));
        if(bill.orderRemark) lines.push("订单备注：" + bill.orderRemark);
        if(bill.cashierName) lines.push("收银员：" + bill.cashierName + (bill.cashierPhone ? " " + bill.cashierPhone : ""));
        bill.text = lines.join("\n");
      }
      return bill;
    };
  }

  if(typeof finalizeOrderV107 === "function"){
    window.confirmOrderFromCodeBill = function(){
      window.openCheckoutConfirmModalV107();
    };
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", ensureModalDom);
  }else{
    ensureModalDom();
  }
})();

/* extracted script block 70 */
/* ===== V109：收银台参考图结构补齐，只作用于收银台 ===== */
(function(){
  if(window.__cangjieCashierReferenceV109) return;
  window.__cangjieCashierReferenceV109 = true;

  function ensureCashierReferenceV109(){
    var batchPanel = document.querySelector("#cashierRoot .cashier-batches");
    if(batchPanel && !batchPanel.querySelector(".cashier-batch-head-v109")){
      batchPanel.insertAdjacentHTML("afterbegin", '<div class="cashier-batch-head-v109"><h2>批次</h2><button type="button" class="cashier-batch-add-v109" onclick="showAppPage(&quot;inbound&quot;)">+</button></div>');
    }
    var productArea = document.querySelector("#cashierRoot .cashier-product-area");
    if(productArea && !productArea.querySelector(".cashier-product-head-v109")){
      productArea.insertAdjacentHTML("afterbegin", '<div class="cashier-product-head-v109"><h2>商品</h2><div class="cashier-product-toggle-v109"><button type="button" class="active">全</button><button type="button">子</button></div></div>');
    }
    var tableHead = document.querySelector("#cashierRoot .order-table-head");
    if(tableHead){
      tableHead.innerHTML = "<span>商品</span><span>件数</span><span>斤数</span><span>单价</span><span>金额</span><span>操作</span>";
    }
    var pay = document.getElementById("cashierPayMode");
    if(pay && !pay.__cashierReferenceV109){
      pay.innerHTML = '<option value="cash">现金支付</option><option value="mixed">部分收款</option><option value="debt">赊欠</option>';
      pay.__cashierReferenceV109 = true;
    }
  }

  var oldRenderCurrentV109 = typeof window.renderCurrentCodeBill === "function" ? window.renderCurrentCodeBill : null;
  if(oldRenderCurrentV109 && !oldRenderCurrentV109.__cashierReferenceV109){
    window.renderCurrentCodeBill = function(){
      ensureCashierReferenceV109();
      var result = oldRenderCurrentV109.apply(this, arguments);
      ensureCashierReferenceV109();
      return result;
    };
    window.renderCurrentCodeBill.__cashierReferenceV109 = true;
  }
  var oldRenderAllV109 = typeof window.renderCashierAll === "function" ? window.renderCashierAll : null;
  if(oldRenderAllV109 && !oldRenderAllV109.__cashierReferenceV109){
    window.renderCashierAll = function(){
      var result = oldRenderAllV109.apply(this, arguments);
      ensureCashierReferenceV109();
      return result;
    };
    window.renderCashierAll.__cashierReferenceV109 = true;
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", ensureCashierReferenceV109);
  else ensureCashierReferenceV109();
  setTimeout(ensureCashierReferenceV109, 120);
})();

/* extracted script block 71 */
/* ===== V111：仅修复收银页商品区右上角快捷筛选逻辑 ===== */
(function(){
  if(window.__cangjieCashierGoodsScopeV111) return;
  window.__cangjieCashierGoodsScopeV111 = true;

  var currentScopeV111 = "all";
  var oldGetCashierProductsV111 = typeof window.getCashierProducts === "function" ? window.getCashierProducts : null;
  var oldRenderCashierProductsV111 = typeof window.renderCashierProducts === "function" ? window.renderCashierProducts : null;
  var oldRenderCashierAllV111 = typeof window.renderCashierAll === "function" ? window.renderCashierAll : null;

  function firstCharV111(name){
    if(typeof window.firstGoodsChar === "function") return window.firstGoodsChar(name);
    return String(name || "").trim().slice(0, 1);
  }
  function baseProductsV111(skipLetterFilter){
    return oldGetCashierProductsV111 ? oldGetCashierProductsV111.call(window, skipLetterFilter) : [];
  }
  function scopedProductsV111(skipLetterFilter){
    var products = baseProductsV111(skipLetterFilter);
    if(currentScopeV111 !== "all"){
      products = products.filter(function(goods){
        return firstCharV111(goods && goods.name) === currentScopeV111;
      });
    }
    return products;
  }
  function scopeButtonsV111(){
    var letters = [];
    baseProductsV111(true).forEach(function(goods){
      var ch = firstCharV111(goods && goods.name);
      if(ch && !letters.includes(ch)) letters.push(ch);
    });
    return ["全"].concat(letters);
  }

  function syncToggleStateV111(){
    var wrap = document.querySelector("#cashierRoot .cashier-product-toggle-v109");
    if(!wrap) return;
    var buttons = scopeButtonsV111();
    wrap.innerHTML = buttons.map(function(label){
      var scope = label === "全" ? "all" : label;
      return '<button type="button" class="' + (scope === currentScopeV111 ? 'active' : '') + '" data-scope-v111="' + label + '">' + label + '</button>';
    }).join("");
  }

  window.selectCashierGoodsScopeV111 = function(scope){
    currentScopeV111 = !scope || scope === "all" || scope === "全" ? "all" : String(scope);
    syncToggleStateV111();
    if(typeof window.renderCashierProducts === "function") window.renderCashierProducts();
  };

  if(oldGetCashierProductsV111 && !oldGetCashierProductsV111.__goodsScopeV111Wrapped){
    window.getCashierProducts = function(skipLetterFilter){
      return scopedProductsV111(skipLetterFilter);
    };
    window.getCashierProducts.__goodsScopeV111Wrapped = true;
  }

  if(oldRenderCashierProductsV111 && !oldRenderCashierProductsV111.__goodsScopeV111Wrapped){
    window.renderCashierProducts = function(){
      var result = oldRenderCashierProductsV111.apply(this, arguments);
      syncToggleStateV111();
      var box = document.getElementById("cashierProducts");
      if(box && currentScopeV111 !== "all" && !scopedProductsV111(false).length){
        var hasAny = baseProductsV111(false).length > 0;
        if(hasAny){
          box.innerHTML = '<div class="order-empty">当前筛选暂无货品</div>';
        }
      }
      return result;
    };
    window.renderCashierProducts.__goodsScopeV111Wrapped = true;
  }

  if(oldRenderCashierAllV111 && !oldRenderCashierAllV111.__goodsScopeV111Wrapped){
    window.renderCashierAll = function(){
      currentScopeV111 = "all";
      var result = oldRenderCashierAllV111.apply(this, arguments);
      syncToggleStateV111();
      return result;
    };
    window.renderCashierAll.__goodsScopeV111Wrapped = true;
  }

  document.addEventListener("click", function(ev){
    var btn = ev.target && ev.target.closest ? ev.target.closest("#cashierRoot .cashier-product-toggle-v109 button") : null;
    if(!btn) return;
    ev.preventDefault();
    ev.stopPropagation();
    if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    window.selectCashierGoodsScopeV111(btn.getAttribute("data-scope-v111") || String(btn.textContent || "").trim());
    return false;
  }, true);

  currentScopeV111 = "all";
  setTimeout(syncToggleStateV111, 0);
  setTimeout(syncToggleStateV111, 240);
})();

/* extracted script block 72 */
(function(){
  function bindBuyerTriggerV114(){
    var wrap = document.getElementById("cashierBuyerTreeV82");
    var trigger = document.getElementById("cashierBuyerTreeTriggerV82");
    if(!wrap || !trigger || trigger.__pickerFixV114) return;
    trigger.addEventListener("pointerdown", function(ev){
      if(ev.pointerType === "mouse") return;
      ev.preventDefault();
      ev.stopPropagation();
      if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      if(typeof window.renderCashierBuyerTreeV82 === "function") window.renderCashierBuyerTreeV82();
      wrap.classList.toggle("open");
      return false;
    }, true);
    trigger.__pickerFixV114 = true;
  }
  setTimeout(bindBuyerTriggerV114, 0);
  setTimeout(bindBuyerTriggerV114, 400);
  document.addEventListener("click", function(){ setTimeout(bindBuyerTriggerV114, 0); }, true);
})();

/* extracted script block 73 */
(function(){
  function mergeCashierCustomersV115(){
    var base = Array.isArray(window.cashierCustomers) ? window.cashierCustomers : [];
    var extras = [];
    [window.buyers, window.buyerV47List, window.customers].forEach(function(list){
      if(Array.isArray(list)) extras = extras.concat(list);
    });
    var byKey = {};
    var rows = [];
    function pushOne(item){
      if(!item) return;
      var name = String(item.name || item.customerName || '').trim();
      var id = String(item.id || item.customerId || '').trim();
      if(!name && !id) return;
      var key = id || ('name:' + name);
      if(byKey[key]) return;
      byKey[key] = true;
      rows.push({
        id: id || ('c' + Date.now() + Math.floor(Math.random()*1000)),
        name: name || '买家',
        debt: Number(item.debt || 0),
        payments: Array.isArray(item.payments) ? item.payments : [],
        parentId: item.parentId || '',
        disabled: !!item.disabled
      });
    }
    base.forEach(pushOne);
    extras.forEach(pushOne);
    var temp = rows.find(function(c){ return c.id === 'c1' || c.name === '临时客户' || String(c.name || '').startsWith('临时客户'); });
    if(!temp){
      rows.unshift({id:'c1', name:'临时客户', debt:0, payments:[], parentId:'', disabled:false});
    }else{
      temp.id = 'c1';
      temp.name = '临时客户';
      temp.disabled = false;
      temp.parentId = '';
    }
    window.cashierCustomers = rows;
    return rows;
  }
  function syncCustomerDisplayAfterRenderV120(id){
    try{
      var sel = document.getElementById('cashierCustomer');
      var keepId = String(id || '');
      if(sel && keepId){
        var hasOption = Array.from(sel.options || []).some(function(opt){ return opt.value === keepId; });
        if(hasOption) sel.value = keepId;
      }
    }catch(err){}
    try{
      if(typeof window.renderCashierBuyerTreeV82 === 'function') window.renderCashierBuyerTreeV82();
    }catch(err){}
    try{
      if(document.getElementById('checkoutConfirmMaskV107') && document.getElementById('checkoutConfirmMaskV107').classList.contains('show')){
        if(typeof window.renderModalV107 === 'function') window.renderModalV107();
      }
    }catch(err){}
  }
  function syncPickerCustomerLabelV115(){
    syncCustomerDisplayAfterRenderV120();
  }
  var oldRenderCustomersV115 = typeof window.renderCashierCustomers === 'function' ? window.renderCashierCustomers : null;
  if(oldRenderCustomersV115 && !oldRenderCustomersV115.__customerFixV115Wrapped){
    window.renderCashierCustomers = function(){
      mergeCashierCustomersV115();
      var result = oldRenderCustomersV115.apply(this, arguments);
      syncPickerCustomerLabelV115();
      return result;
    };
    window.renderCashierCustomers.__customerFixV115Wrapped = true;
  }
  var oldHandleCustomerV115 = typeof window.handleCustomerOrPayChange === 'function' ? window.handleCustomerOrPayChange : null;
  if(oldHandleCustomerV115 && !oldHandleCustomerV115.__customerFixV115Wrapped){
    window.handleCustomerOrPayChange = function(){
      var result = oldHandleCustomerV115.apply(this, arguments);
      syncPickerCustomerLabelV115();
      return result;
    };
    window.handleCustomerOrPayChange.__customerFixV115Wrapped = true;
  }
  function bindBuyerTriggerV115(){
    var wrap = document.getElementById('cashierBuyerTreeV82');
    var trigger = document.getElementById('cashierBuyerTreeTriggerV82');
    if(!wrap || !trigger || trigger.__pickerFixV115) return;
    ['touchstart','pointerdown'].forEach(function(type){
      trigger.addEventListener(type, function(ev){
        if(type === 'pointerdown' && ev.pointerType === 'mouse') return;
        ev.preventDefault();
        ev.stopPropagation();
        if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
        mergeCashierCustomersV115();
        if(typeof window.renderCashierBuyerTreeV82 === 'function') window.renderCashierBuyerTreeV82();
        wrap.classList.toggle('open');
        return false;
      }, true);
    });
    trigger.__pickerFixV115 = true;
  }
  mergeCashierCustomersV115();
  setTimeout(function(){
    try{ if(typeof window.renderCashierCustomers === 'function') window.renderCashierCustomers(); }catch(err){}
    bindBuyerTriggerV115();
  }, 0);
  setTimeout(bindBuyerTriggerV115, 400);
  document.addEventListener('click', function(){ setTimeout(bindBuyerTriggerV115, 0); }, true);
})();
