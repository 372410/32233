/**
 * 涂装MES系统 - 应用逻辑
 * 路由系统 + 页面渲染 + 交互逻辑
 */

// 当前状态
let currentPage = 'dashboard-overview';
let expandedMenus = new Set(['dashboard']); // 默认展开的菜单

// ============ 初始化 ============
function init() {
    renderSidebar();
    renderModuleTabs(); // 渲染顶部模块 Tab 标签栏（默认选中【数据概览】）
    navigateTo('dashboard-overview', '数据概览');
    showLogin(); // 页面打开即显示登录遮罩弹窗，MES 主界面隐藏
}

// ============ 侧边栏导航 ============
function renderSidebar() {
    const nav = document.getElementById('sidebarNav');
    // 任务执行页/质检报告页时保持来源菜单高亮
    let activePage = currentPage;
    if (currentPage === 'maintenance-task-exec') activePage = 'maintenance-task';
    if (currentPage === 'qc-report' && window._qcReportFrom) activePage = window._qcReportFrom;
    // 质检报告工作台保持来源菜单（来料检/出货检/过程检/成品入库检）高亮
    if (currentPage === 'qc-report-edit' && window._qtForm && window._qtForm.from) activePage = window._qtForm.from;
    if (INV_EDIT_FROM[currentPage]) activePage = INV_EDIT_FROM[currentPage];
    // 能耗记录编辑页/数据采集编辑页保持来源菜单高亮
    if (currentPage === 'energy-edit') activePage = 'energy-record';
    if (DC_EDIT_FROM[currentPage]) activePage = DC_EDIT_FROM[currentPage];
    nav.innerHTML = MENU.map(item => {
        if (item.children) {
            const isExpanded = expandedMenus.has(item.id);
            const hasActiveChild = item.children.some(c => c.page === activePage);
            if (hasActiveChild) expandedMenus.add(item.id);
            return `
                <div class="menu-group">
                    <div class="menu-item ${isExpanded ? 'expanded' : ''}" onclick="toggleMenu('${item.id}')">
                        <span class="menu-icon">${item.icon}</span>
                        <span class="menu-label">${item.label}</span>
                        <span class="menu-arrow">▶</span>
                    </div>
                    <div class="menu-sub ${isExpanded ? 'expanded' : ''}" id="sub-${item.id}">
                        ${item.children.map(child => `
                            <div class="sub-item ${child.page === activePage ? 'active' : ''}" onclick="navigateTo('${child.page}', '${child.label}')">
                                ${child.label}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="menu-item ${item.page === currentPage ? 'active' : ''}" onclick="navigateTo('${item.page}', '${item.label}')">
                    <span class="menu-icon">${item.icon}</span>
                    <span class="menu-label">${item.label}</span>
                </div>
            `;
        }
    }).join('');
}

function toggleMenu(menuId) {
    if (expandedMenus.has(menuId)) {
        expandedMenus.delete(menuId);
    } else {
        expandedMenus.add(menuId);
    }
    renderSidebar();
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('collapsed');
    // 侧栏折叠会改变内容区宽度，过渡动画结束后让所有图表自适应新宽度
    setTimeout(ecResizeAll, 350);
}

// ============ ECharts 图表统一管理 ============
// 说明：所有 ECharts 实例统一登记；页面切换前统一销毁（容器已被替换），
// 窗口缩放 / 侧栏折叠时统一 resize，保证图表自适应容器宽度。
const EC_INSTANCES = {}; // 图表实例登记表 { 容器id: echarts实例 }

// 初始化（或重建）一个图表实例
function ecInit(domId, option) {
    const dom = document.getElementById(domId);
    if (!dom || !window.echarts) return null; // 容器不存在或 ECharts 未加载时静默跳过
    if (EC_INSTANCES[domId]) { EC_INSTANCES[domId].dispose(); } // 防止重复初始化
    const inst = window.echarts.init(dom);
    inst.setOption(option);
    EC_INSTANCES[domId] = inst;
    return inst;
}

// 销毁全部图表实例（页面切换前调用，避免内存泄漏）
function ecDisposeAll() {
    Object.keys(EC_INSTANCES).forEach(id => {
        if (EC_INSTANCES[id]) { EC_INSTANCES[id].dispose(); delete EC_INSTANCES[id]; }
    });
}

// 全部图表自适应容器大小
function ecResizeAll() {
    Object.keys(EC_INSTANCES).forEach(id => {
        if (EC_INSTANCES[id]) EC_INSTANCES[id].resize();
    });
}

// 按当前页面初始化对应的 ECharts 图表（路由渲染完成后调用）
function initPageCharts(pageId) {
    // 未登录时主界面隐藏（容器宽度为 0），跳过初始化，登录显示后再渲染
    if (!isLoggedIn) return;
    if (pageId === 'dashboard-overview') {
        // 首页数据概览：近7日完工趋势柱状图 + 生产中心看板甘特图 + 不良原因环形饼图
        ecInit('weeklyTrendChart', buildWeeklyTrendOption());
        ecInit('prodBoardChart', buildProdBoardOption());
        ecInit('defectPieChart', buildDefectPieOption());
    } else if (pageId === 'qc-batch') {
        // 批量质检统计：质检任务状态分布 + 检验类型分布（双饼图）
        ecInit('qcStatusPieChart', buildQcStatusPieOption());
        ecInit('qcTypePieChart', buildQcTypePieOption());
    } else if (pageId === 'qc-single') {
        // 单独质检统计：各检验项目合格率饼图
        ecInit('qcItemPieChart', buildQcItemPieOption());
    }
}

// ============ 路由导航 ============
function navigateTo(pageId, label) {
    currentPage = pageId;
    const config = PAGE_CONFIG[pageId];

    // 切换页面时清除搜索状态
    if (pageId !== 'product-list') {
        window._productSearchKeyword = '';
        selectedCategory = 'all';
    }
    window._filteredData = null;
    window._genericSearchKeyword = '';
    window._poFiltered = null;
    document._poSearchVal = null;
    window._ptFiltered = null;
    window._wrFiltered = null;
    window._invStockKw = '';
    window._invAlertFilter = null;
    // 能耗/数据采集：离开编辑页时清理草稿
    if (pageId !== 'energy-edit') { window._enForm = null; window._enEditId = null; }
    if (pageId !== 'dc-batch') { window._dcForm = null; window._dcEditId = null; }
    if (pageId !== 'qc-report-edit') { window._qtForm = null; } // 离开质检报告工作台时清空草稿
    if (pageId !== 'dc-view') { window._dcViewId = null; }
    if (pageId !== 'dc-chart') { window._dcChartId = null; }

    // 更新页面标题
    const titleEl = document.getElementById('pageTitle');
    if (label) {
        titleEl.textContent = label;
        window._lastPageLabel = label; // 记录最近一次页面标题（登录后重渲染时使用）
    } else if (config && config.title) {
        titleEl.textContent = config.title;
        window._lastPageLabel = config.title;
    }

    // 更新导航高亮
    renderSidebar();

    // 页面切换前销毁上一页的 ECharts 实例（内容容器即将被整体替换）
    ecDisposeAll();

    // 渲染内容
    const content = document.getElementById('content');
    if (config && config.type === 'dashboard') {
        content.innerHTML = renderDashboard();
    } else if (config && config.type === 'custom' && config.render === 'renderWorkBench') {
        content.innerHTML = renderWorkBench();
    } else if (config && config.type === 'custom' && config.render === 'renderProductionOrderPage') {
        content.innerHTML = renderProductionOrderPage();
    } else if (config && config.type === 'custom' && config.render === 'renderProcessTaskPage') {
        content.innerHTML = renderProcessTaskPage();
    } else if (config && config.type === 'custom' && config.render === 'renderWorkReportPage') {
        content.innerHTML = renderWorkReportPage();
    } else if (config && config.type === 'custom' && config.render === 'renderTaskExecPage') {
        content.innerHTML = renderTaskExecPage();
    } else if (config && config.type === 'custom' && config.render === 'renderQcBatchPage') {
        content.innerHTML = renderQcBatchPage();
    } else if (config && config.type === 'custom' && config.render === 'renderQcSinglePage') {
        content.innerHTML = renderQcSinglePage();
    } else if (config && config.type === 'custom' && config.render === 'renderQcReportPage') {
        content.innerHTML = renderQcReportPage();
    } else if (config && config.type === 'custom' && config.render === 'renderQcReportEditPage') {
        content.innerHTML = renderQcReportEditPage();
        qtCalcRefresh(); // 渲染后立即计算顶部实时统计与综合判定
    } else if (config && config.type === 'custom' && config.render === 'renderInvStockPage') {
        content.innerHTML = renderInvStockPage();
    } else if (config && config.type === 'custom' && config.render === 'renderInvAlertPage') {
        content.innerHTML = renderInvAlertPage();
    } else if (config && config.type === 'custom' && config.render === 'renderInvOpEditPage') {
        content.innerHTML = renderInvOpEditPage();
    } else if (config && config.type === 'custom' && config.render === 'renderInvSalesEditPage') {
        content.innerHTML = renderInvSalesEditPage();
    } else if (config && config.type === 'custom' && config.render === 'renderEnergyPricePage') {
        content.innerHTML = renderEnergyPricePage();
    } else if (config && config.type === 'custom' && config.render === 'renderEnergyInitialPage') {
        content.innerHTML = renderEnergyInitialPage();
    } else if (config && config.type === 'custom' && config.render === 'renderEnergyEditPage') {
        content.innerHTML = renderEnergyEditPage();
        enCalcRefresh(); // 渲染后立即计算上期读数/使用量/费用
    } else if (config && config.type === 'custom' && config.render === 'renderDcFeedingPage') {
        content.innerHTML = renderDcFeedingPage();
    } else if (config && config.type === 'custom' && config.render === 'renderDcBatchPage') {
        content.innerHTML = renderDcBatchPage();
    } else if (config && config.type === 'custom' && config.render === 'renderDcViewPage') {
        content.innerHTML = renderDcViewPage();
    } else if (config && config.type === 'custom' && config.render === 'renderDcChartPage') {
        content.innerHTML = renderDcChartPage();
    } else if (config) {
        content.innerHTML = renderTablePage(config);
    } else {
        content.innerHTML = '<div class="card"><div class="card-body"><p>页面建设中...</p></div></div>';
    }

    // 滚动到顶部
    content.scrollTop = 0;

    // 初始化当前页的 ECharts 图表（未登录时内部会自动跳过）
    initPageCharts(pageId);
    // 同步顶部模块 Tab 标签高亮（侧边栏与 Tab 双向联动）
    updateModuleTabs(pageId);
}

// ============ 首页看板渲染 ============
function renderDashboard() {
    const d = DASHBOARD_DATA;
    return `
        <!-- 统计卡片 -->
        <div class="stats-grid">
            ${d.stats.map(s => `
                <div class="stat-card" style="border-left:4px solid ${s.color};">
                    <div class="stat-icon" style="background:${s.color}15;color:${s.color};">${s.icon}</div>
                    <div>
                        <div class="stat-value" style="color:${s.color};">${s.value}</div>
                        <div class="stat-label">${s.label}</div>
                    </div>
                </div>
            `).join('')}
        </div>

        <!-- 图表区域 -->
        <div class="dashboard-charts">
            <!-- 近7日完工数量趋势（ECharts 柱状图） -->
            <div class="card chart-card">
                <div class="card-header">
                    <span class="card-title">近7日完工数量趋势</span>
                </div>
                <div class="card-body">
                    <!-- 柱状图容器：由 initPageCharts 统一初始化 -->
                    <div id="weeklyTrendChart" class="echart-box"></div>
                </div>
            </div>

            <!-- 不良原因统计（ECharts 环形饼图） -->
            <div class="card chart-card">
                <div class="card-header">
                    <span class="card-title">不良原因统计</span>
                </div>
                <div class="card-body">
                    <!-- 饼图容器：由 initPageCharts 统一初始化 -->
                    <div id="defectPieChart" class="echart-box"></div>
                </div>
            </div>
        </div>

        <!-- 生产中心看板（ECharts 甘特图，通栏 100% 宽度） -->
        <div class="card prod-board">
            <div class="card-header">
                <span class="card-title">生产中心看板</span>
                <!-- 右上角时间范围切换按钮：默认选中【本周】，仅做界面切换，不含真实数据逻辑 -->
                <div class="board-toggle">
                    <button type="button" class="board-btn active" onclick="switchBoardRange(this)">本周</button>
                    <button type="button" class="board-btn" onclick="switchBoardRange(this)">本月</button>
                </div>
            </div>
            <div class="card-body">
                <!-- 甘特图容器：高度 750px，由 initPageCharts 统一初始化 -->
                <div id="prodBoardChart" style="width:100%;height:750px;"></div>
            </div>
        </div>

        <!-- 订单到期情况 + 完成订单数量 -->
        <div class="dashboard-charts">
            <div class="card chart-card">
                <div class="card-header">
                    <span class="card-title">订单到期情况</span>
                </div>
                <div class="table-wrapper" style="box-shadow:none;border-radius:0;">
                    <table>
                        <thead><tr><th>订单编号</th><th>产品</th><th>剩余天数</th><th>状态</th></tr></thead>
                        <tbody>
                            ${d.orderExpiry.map(o => `
                                <tr>
                                    <td>${o.orderNo}</td>
                                    <td>${o.product}</td>
                                    <td>${o.daysLeft}天</td>
                                    <td><span class="tag ${o.status === '紧急' ? 'tag-danger' : 'tag-success'}">${o.status}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card chart-card">
                <div class="card-header">
                    <span class="card-title">完成订单数量统计</span>
                </div>
                <div class="card-body" style="display:flex;align-items:center;justify-content:center;gap:40px;">
                    <div style="text-align:center;">
                        <div style="font-size:48px;font-weight:700;color:#52c41a;">25</div>
                        <div style="color:#909399;font-size:13px;">本月已完成</div>
                    </div>
                    <div style="width:1px;height:60px;background:#e4e7ed;"></div>
                    <div style="text-align:center;">
                        <div style="font-size:48px;font-weight:700;color:#1890ff;">28</div>
                        <div style="color:#909399;font-size:13px;">本月总数</div>
                    </div>
                    <div style="width:1px;height:60px;background:#e4e7ed;"></div>
                    <div style="text-align:center;">
                        <div style="font-size:48px;font-weight:700;color:#faad14;">89.3%</div>
                        <div style="color:#909399;font-size:13px;">完成率</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 今日报工明细 -->
        <div class="card">
            <div class="card-header">
                <span class="card-title">今日报工明细</span>
            </div>
            <div class="table-wrapper" style="box-shadow:none;border-radius:0;">
                <table>
                    <thead><tr><th>报工人员</th><th>工序</th><th>产品</th><th>完成数量</th><th>不良品</th><th>报工时间</th></tr></thead>
                    <tbody>
                        ${d.todayReports.map(r => `
                            <tr>
                                <td>${r.reporter}</td>
                                <td>${r.process}</td>
                                <td>${r.product}</td>
                                <td>${r.qty}</td>
                                <td>${r.defectQty > 0 ? `<span style="color:#ff4d4f;">${r.defectQty}</span>` : '0'}</td>
                                <td>${r.time}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ============ 生产中心看板 / 不良原因饼图（ECharts 配置构建） ============

// 【本周 / 本月】切换按钮：仅做选中态切换（界面演示，不切换真实数据）
function switchBoardRange(btn) {
    const wrap = btn.parentElement;
    wrap.querySelectorAll('.board-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

// 时间戳格式化：MM-DD HH:mm（甘特图悬浮提示用）
function ganttFmtTime(ts) {
    const d = new Date(ts);
    const p = n => String(n).padStart(2, '0');
    return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// 甘特图任务条绘制函数（ECharts custom 自定义系列）
// 数据结构：value = [设备下标, 开始时间戳, 结束时间戳]
function renderGanttBar(params, api) {
    const deviceIdx = api.value(0);
    const start = api.coord([api.value(1), deviceIdx]); // 起点像素坐标
    const end = api.coord([api.value(2), deviceIdx]);   // 终点像素坐标
    const bandH = api.size([0, 1])[1];                  // 类目带（行）高度
    const barH = Math.min(bandH * 0.5, 34);             // 任务条高度（占行高一半，上限 34px）
    const barW = Math.max(end[0] - start[0], 2);        // 任务条宽度（至少 2px）
    // 圆角矩形任务条
    const rectShape = {
        type: 'rect',
        shape: { x: start[0], y: start[1] - barH / 2, width: barW, height: barH, r: 4 },
        style: api.style(),
    };
    const children = [rectShape];
    // 任务条足够宽时，在条内绘制白色工单号文字
    // 注意：ECharts 在高亮/渐进渲染等阶段回调时 params.data 可能为 undefined，需做空值保护
    const orderNo = params.data ? params.data.order : '';
    if (orderNo && barW > 88) {
        children.push({
            type: 'text',
            style: {
                text: orderNo,
                x: start[0] + 10,
                y: start[1],
                fill: '#fff',
                fontSize: 11,
                fontWeight: 500,
                verticalAlign: 'middle',
            },
        });
    }
    return { type: 'group', children };
}

// 生产中心看板：ECharts 甘特图配置
function buildProdBoardOption() {
    const data = PROD_BOARD_DATA;
    const colors = data.statusColors;
    const statusList = Object.keys(colors); // ['生产中', '已完成', '延期']
    // 按状态拆分为 3 个 custom 系列，天然支持图例点击显隐
    const series = statusList.map(status => ({
        name: status,
        type: 'custom',
        renderItem: renderGanttBar,
        itemStyle: { color: colors[status] },
        encode: { x: [1, 2], y: 0 },
        clip: true,
        data: data.tasks.filter(t => t.status === status).map(t => ({
            value: [data.devices.indexOf(t.device), new Date(t.start).getTime(), new Date(t.end).getTime()],
            order: t.order,
            device: t.device,
            status: t.status,
            qty: t.qty,
            note: t.note,
        })),
    }));
    return {
        // 悬浮提示：工单号 / 设备 / 状态 / 起止时间 / 数量 / 备注
        tooltip: {
            formatter: (p) => {
                const d = p.data;
                // 空值保护：data 异常时返回空串，避免渲染报错
                if (!d || !d.value) { return ''; }
                return `<div style="line-height:20px;">
                    <b>${d.order}</b><br/>
                    设备/工序：${d.device}<br/>
                    状态：${d.status}<br/>
                    计划时间：${ganttFmtTime(d.value[1])} ~ ${ganttFmtTime(d.value[2])}<br/>
                    计划数量：${d.qty} 件<br/>
                    备注：${d.note}
                </div>`;
            },
        },
        // 图例：蓝色=生产中，绿色=已完成，橙色=延期
        legend: {
            top: 6,
            left: 'center',
            data: statusList,
            itemWidth: 16,
            itemHeight: 10,
            textStyle: { color: '#606266', fontSize: 13 },
        },
        grid: { left: 110, right: 40, top: 46, bottom: 56 },
        // X 轴时间轴：2026-05-12 ~ 2026-05-15，每 8 小时一个刻度（08:00 / 16:00 / 24:00）
        xAxis: {
            type: 'time',
            min: new Date(data.timeStart).getTime(),
            max: new Date(data.timeEnd).getTime(),
            interval: 8 * 3600 * 1000,
            axisLabel: {
                // 每个刻度展示「日期 + 小时」，24:00 归属前一天显示
                formatter: (val) => {
                    const d = new Date(val);
                    let day = d;
                    let hh = d.getHours();
                    if (hh === 0) { day = new Date(val - 86400000); hh = 24; }
                    const p = n => String(n).padStart(2, '0');
                    return `${p(day.getMonth() + 1)}-${p(day.getDate())}\n${p(hh)}:00`;
                },
                color: '#606266',
                fontSize: 12,
                lineHeight: 17,
                margin: 12,
            },
            axisLine: { lineStyle: { color: '#dcdfe6' } },
            axisTick: { show: true, alignWithLabel: true, lineStyle: { color: '#dcdfe6' } },
            // 竖向分割网格线：模拟截图中的时间格子
            splitLine: { show: true, lineStyle: { color: '#e4e7ed', width: 1 } },
        },
        // Y 轴设备/工序列表（inverse：第一个设备显示在最上方）
        yAxis: {
            type: 'category',
            data: data.devices,
            inverse: true,
            axisLabel: { color: '#303133', fontSize: 13, fontWeight: 500, margin: 14 },
            axisLine: { lineStyle: { color: '#dcdfe6' } },
            axisTick: { show: false },
            splitLine: { show: true, lineStyle: { color: '#f0f2f5' } },
        },
        series,
    };
}

// 不良原因统计：环形饼图（甜甜圈，中间留白）
function buildDefectPieOption() {
    const list = DASHBOARD_DATA.defectReasons;
    // 指定配色：表面划伤红 / 色差橙 / 厚度不足橙 / 流挂蓝 / 其他蓝
    const colorMap = { '表面划伤': '#f24848', '色差': '#ffaa00', '厚度不足': '#ffaa00', '流挂': '#2b88f0', '其他': '#2b88f0' };
    return {
        color: list.map(d => colorMap[d.name] || '#2b88f0'),
        // 悬浮提示：名称 / 件数 / 占比百分比
        tooltip: {
            trigger: 'item',
            formatter: (p) => `${p.name}<br/>件数：${p.value} 件<br/>占比：${p.percent}%`,
        },
        series: [{
            type: 'pie',
            radius: ['42%', '68%'], // 环形：中间留白
            center: ['50%', '50%'],
            avoidLabelOverlap: true,
            itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 4 },
            // 外部标签：名称 件数 (百分比)，如「表面划伤 8件 (40%)」
            label: {
                show: true,
                position: 'outside',
                formatter: '{b} {c}件 ({d}%)',
                color: '#606266',
                fontSize: 12,
            },
            labelLine: { show: true, length: 12, length2: 10, lineStyle: { color: '#c0c4cc' } },
            data: list.map(d => ({ name: d.name, value: d.count })),
        }],
    };
}

// 近7日完工数量趋势：ECharts 柱状图配置
// 渐变蓝柱体 + 圆角柱顶 + 网格线 + 悬浮提示，高度随数据差异直观呈现
function buildWeeklyTrendOption() {
    const list = DASHBOARD_DATA.weeklyChart; // [{ day: '周一', value: 120 }, ...]
    return {
        // 悬浮提示：日期 + 完工数量（件）
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (ps) => {
                const p = ps[0];
                return `${p.name}<br/>完工数量：<b>${p.value}</b> 件`;
            },
        },
        // 网格：留出坐标轴空间
        grid: { left: 48, right: 20, top: 30, bottom: 34 },
        // X 轴：周一 ~ 周日
        xAxis: {
            type: 'category',
            data: list.map(d => d.day),
            axisLabel: { color: '#606266', fontSize: 12 },
            axisLine: { lineStyle: { color: '#dcdfe6' } },
            axisTick: { show: false },
        },
        // Y 轴：数量刻度（按数据自适应）
        yAxis: {
            type: 'value',
            name: '件',
            nameTextStyle: { color: '#909399', fontSize: 11 },
            axisLabel: { color: '#909399', fontSize: 11 },
            splitLine: { lineStyle: { color: '#f0f2f5' } },
        },
        series: [{
            name: '完工数量',
            type: 'bar',
            barWidth: '46%',
            // 柱顶数值标签
            label: { show: true, position: 'top', color: '#606266', fontSize: 12, fontWeight: 600 },
            // 渐变蓝柱体 + 圆角柱顶
            itemStyle: {
                borderRadius: [6, 6, 0, 0],
                color: {
                    type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: '#40a9ff' },
                        { offset: 1, color: '#096dd9' },
                    ],
                },
            },
            // 最高柱高亮强调（与系统主题一致），其余柱体渐变蓝
            data: list.map(d => ({
                value: d.value,
                itemStyle: (d.value === Math.max(...list.map(x => x.value)))
                    ? { borderRadius: [6, 6, 0, 0], color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#36cfc9' }, { offset: 1, color: '#08979c' }] } }
                    : undefined,
            })),
        }],
    };
}

// ============ 报工工作台 ============
// ============ 生产订单：工序进度表格 ============
// 圆环进度组件：有进度=蓝色圆环+百分比；0%=灰色空心圆环
function renderProgressRing(name, pct) {
    const started = pct > 0;                     // 是否已开始（有进度）
    const done = pct >= 100;                     // 是否已完成
    // 圆环SVG：半径26，周长2πr≈163.36
    const R = 26;
    const C = 2 * Math.PI * R;
    const offset = C * (1 - pct / 100);
    const ringColor = started ? 'var(--primary)' : '#cccccc';   // 蓝/灰
    const textColor = started ? 'var(--primary)' : '#999999';
    const centerText = done ? '✓' : pct + '%';
    return `
        <div class="po-ring-wrap" title="${name} ${pct}%">
            <div class="po-ring">
                <svg width="64" height="64" viewBox="0 0 64 64">
                    <!-- 底环（灰色轨道） -->
                    <circle cx="32" cy="32" r="${R}" fill="#ffffff" stroke="${started ? '#e6f0ff' : '#f0f0f0'}" stroke-width="6"></circle>
                    <!-- 进度环 -->
                    <circle cx="32" cy="32" r="${R}" fill="none" stroke="${ringColor}" stroke-width="6"
                        stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${offset}"
                        transform="rotate(-90 32 32)"></circle>
                </svg>
                <span class="po-ring-text ${done ? 'done' : ''}" style="color:${textColor}">${centerText}</span>
            </div>
            <span class="po-ring-name">${name}</span>
        </div>
    `;
}

// 一行工序节点组：圆环之间用灰色短横线连接，超出宽度横向滚动
function renderNodeGroup(nodes) {
    return `
        <div class="po-nodes-scroll">
            <div class="po-nodes">
                ${nodes.map((n, i) => `
                    ${i > 0 ? '<span class="po-link"></span>' : ''}
                    ${renderProgressRing(n.name, n.pct)}
                `).join('')}
            </div>
        </div>
    `;
}

// “更多”下拉菜单：fixed 浮层，脱离表格滚动容器，永不裁剪
function togglePoMore(btn) {
    const existing = document.getElementById('po-more-menu');
    // 已打开则关闭（点击同一按钮）
    if (existing && existing._trigger === btn) { closePoMore(); return; }
    closePoMore();

    // 复制该行的菜单项
    const srcMenu = btn.parentElement.querySelector('.po-dropdown-menu');
    if (!srcMenu) return;

    const menu = document.createElement('div');
    menu.id = 'po-more-menu';
    menu.className = 'po-float-menu';
    menu.innerHTML = srcMenu.innerHTML;
    document.body.appendChild(menu);
    menu._trigger = btn;

    // fixed 定位：按按钮在视口的实时坐标计算
    const r = btn.getBoundingClientRect();
    const mw = menu.offsetWidth, mh = menu.offsetHeight;
    let left = r.left;
    // 靠近视口右边缘时右对齐
    if (left + mw > window.innerWidth - 8) left = window.innerWidth - mw - 8;
    let top = r.bottom + 4;
    // 靠近视口底部时向上弹出
    if (top + mh > window.innerHeight - 8) top = Math.max(8, r.top - mh - 4);
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
    menu.classList.add('show');
}

function closePoMore() {
    const m = document.getElementById('po-more-menu');
    if (m) m.remove();
}

// 点击其他区域 / 滚动 / 窗口尺寸变化时关闭浮层
document.addEventListener('click', (e) => {
    if (e.target.closest('.po-dropdown') || e.target.closest('#po-more-menu')) return;
    closePoMore();
    // 不良品项下拉：点击外部关闭
    if (!e.target.closest('#wb-dd-menu') && !e.target.closest('.wb2-dd-box')) wbCloseDefectDd();
});
window.addEventListener('scroll', () => { closePoMore(); wbCloseDefectDd(); }, true);
window.addEventListener('resize', () => { closePoMore(); wbCloseDefectDd(); });

// 生产订单主渲染函数：14列完整表格（参照实际系统）
function renderProductionOrderPage() {
    const config = PAGE_CONFIG['production-order'];
    let html = '';

    // 搜索栏（多条件 + 搜索/重置按钮）
    html += `<div class="search-bar">`;
    config.search.forEach(s => {
        html += `<div class="search-item">`;
        html += `<span class="search-label">${s.label}</span>`;
        if (s.type === 'select') {
            html += `<select class="search-select" id="search-${s.name}">`;
            s.options.forEach(opt => { html += `<option value="${opt}">${opt}</option>`; });
            html += `</select>`;
        } else {
            html += `<input type="text" class="search-input" id="search-${s.name}" placeholder="${s.placeholder || '请输入'}" />`;
        }
        html += `</div>`;
    });
    config.searchButtons.forEach(btn => {
        const cls = btn.type === 'primary' ? 'btn-primary' : '';
        html += `<div class="search-item"><button class="btn ${cls}" onclick="handleButton('${btn.action}', '${config.title}')">${btn.text}</button></div>`;
    });
    html += `</div>`;

    // 工具栏按钮
    html += `<div class="toolbar">`;
    config.buttons.forEach(btn => {
        const cls = btn.type === 'primary' ? 'btn-primary' : '';
        html += `<button class="btn ${cls}" onclick="handleButton('${btn.action}', '${config.title}')">${btn.text}</button>`;
    });
    html += `</div>`;

    // 14列表格（参照实际系统列顺序）
    html += `<div class="table-wrapper po-table-wrapper"><table class="po-table">`;
    html += `<thead><tr>
        <th>客户单号</th>
        <th>内部工单号</th>
        <th>产品编码</th>
        <th>产品名称</th>
        <th>数量</th>
        <th>交付日期</th>
        <th>加急</th>
        <th>订单类型</th>
        <th class="po-progress-col">进度</th>
        <th>工艺路线</th>
        <th>完成状态</th>
        <th>制单人</th>
        <th>创建时间</th>
        <th class="po-fix-right">操作</th>
    </tr></thead>`;
    html += `<tbody id="tableBody">`;
    const poRows = window._poFiltered || config.data;
    poRows.forEach((row, idx) => {
        html += `<tr>`;
        html += `<td>${row.customerOrderNo}</td>`;                       // 客户单号
        html += `<td class="po-mono">${row.orderNo}</td>`;                // 内部工单号
        html += `<td class="po-mono">${row.productCode}</td>`;            // 产品编码
        html += `<td>${row.productName}</td>`;                            // 产品名称
        html += `<td class="po-num">${row.quantity}</td>`;                // 数量
        html += `<td>${row.deliveryDate}</td>`;                           // 交付日期
        html += `<td>${row.urgent === '是' ? '<span class="po-urgent">加急</span>' : '否'}</td>`;  // 加急
        html += `<td>${row.type === '返工' ? `<span class="po-type-tag rework">返工</span>` : `<span class="po-type-tag">正常</span>`}</td>`;  // 订单类型
        html += `<td class="po-progress-cell">${renderNodeGroup(row.nodes)}</td>`;  // 进度（圆环组）
        html += `<td>${row.route}</td>`;                                  // 工艺路线
        html += `<td>${row.finishStatus === '已完成' ? '<span class="po-status-done">已完成</span>' : '<span class="po-status-ing">未完成</span>'}</td>`;  // 完成状态
        html += `<td>${row.creator}</td>`;                                // 制单人
        html += `<td class="po-mono">${row.createTime}</td>`;             // 创建时间
        html += `<td class="po-actions po-fix-right">
            <button class="btn-text-link" onclick="poView(${row.id})">查看</button>
            <button class="btn-text-link" onclick="poEdit(${row.id})">编辑</button>
            <button class="btn-text-link danger" onclick="poDelete(${row.id})">删除</button>
            <span class="po-dropdown">
                <button class="btn-text-link" onclick="event.stopPropagation();togglePoMore(this)">更多 ▾</button>
                <div class="po-dropdown-menu">
                    <div class="po-dropdown-item" onclick="poMenuAction('结案', ${row.id})">结案</div>
                    <div class="po-dropdown-item" onclick="poMenuAction('设置工艺路线', ${row.id})">设置工艺路线</div>
                    <div class="po-dropdown-item" onclick="poMenuAction('下发任务', ${row.id})">下发任务</div>
                    <div class="po-dropdown-item" onclick="poMenuAction('撤回任务', ${row.id})">撤回任务</div>
                    <div class="po-dropdown-item" onclick="poMenuAction('报工', ${row.id})">报工</div>
                    <div class="po-dropdown-item" onclick="poMenuAction('打印', ${row.id})">打印</div>
                </div>
            </span>
        </td>`;
        html += `</tr>`;
    });
    html += `</tbody></table></div>`;

    // 分页（筛选时显示筛选后条数）
    html += renderPagination(poRows.length);
    return html;
}

// 根据 id 查找工单数据
function getPoById(id) {
    return PAGE_CONFIG['production-order'].data.find(d => d.id === id);
}

// ===== 生产订单：查看详情页（独立页面） =====
function poView(id) {
    const row = getPoById(id);
    if (!row) return;
    currentPage = 'production-order-view';

    let html = '';
    // 顶部：返回图标 + 标题(内部工单号) + 打印按钮
    html += `<div class="detail-topbar">
        <button class="back-icon" onclick="navigateTo('production-order','生产订单')" title="返回">‹</button>
        <span class="detail-title">${row.orderNo}</span>
        <span class="detail-title-tags">
            ${row.type === '返工' ? '<span class="po-type-tag rework">返工</span>' : '<span class="po-type-tag">正常</span>'}
            ${row.urgent === '是' ? '<span class="po-urgent">加急</span>' : ''}
            ${row.finishStatus === '已完成' ? '<span class="po-status-done">已完成</span>' : '<span class="po-status-ing">未完成</span>'}
        </span>
        <span class="detail-actions">
            <button class="btn" onclick="alert('打印')"><span>🖨</span> 打印</button>
            <button class="btn btn-primary" onclick="poEdit(${row.id})">编辑</button>
        </span>
    </div>`;

    // 基础信息卡片（2列布局，参照实际系统）
    html += `<div class="card">
        <div class="card-header"><span class="card-title">订单信息</span></div>
        <div class="card-body">
            <div class="detail-grid">
                ${poDetailItem('产品名称', row.productName)}
                ${poDetailItem('产品编码', row.productCode)}
                ${poDetailItem('工艺路线', row.route)}
                ${poDetailItem('订单数量', row.quantity)}
                ${poDetailItem('合格', row.qualified)}
                ${poDetailItem('不合格', row.unqualified)}
                ${poDetailItem('客户', row.customer || '-')}
                ${poDetailItem('客户单号', row.customerOrderNo)}
                ${poDetailItem('交付日期', row.deliveryDate)}
                ${poDetailItem('创建人', row.creator)}
                ${poDetailItem('创建时间', row.createTime)}
                ${poDetailItem('备注', row.remark)}
            </div>
        </div>
    </div>`;

    // 工序进度总览（圆环组）
    html += `<div class="card">
        <div class="card-header"><span class="card-title">工序进度</span></div>
        <div class="card-body po-detail-nodes">${renderNodeGroup(row.nodes)}</div>
    </div>`;

    // 工序任务列表（表格）
    html += `<div class="card">
        <div class="card-header"><span class="card-title">工序任务</span></div>
        <div class="card-body" style="padding:0;">
            <table class="po-table" style="width:100%;">
                <thead><tr>
                    <th>工序名称</th><th>计划数量</th><th>完成数量</th>
                    <th>计划开始</th><th>计划结束</th><th>实际开始</th><th>实际结束</th>
                    <th>描述</th><th style="width:200px;">操作</th>
                </tr></thead>
                <tbody>`;
    row.nodes.forEach((n, i) => {
        html += `<tr>
            <td>${n.name}</td>
            <td class="po-num">${n.planQty}</td>
            <td class="po-num">${n.doneQty}</td>
            <td>${n.planStart || '-'}</td>
            <td>${n.planEnd || '-'}</td>
            <td>${n.actualStart || '-'}</td>
            <td>${n.actualEnd || '-'}</td>
            <td>${n.desc || '-'}</td>
            <td>
                <button class="btn-text-link" onclick="alert('工序参数')">工序参数</button>
                <button class="btn-text-link" onclick="alert('报工')">报工</button>
                <button class="btn-text-link" onclick="alert('报工码')">报工码</button>
            </td>
        </tr>`;
    });
    html += `</tbody></table></div></div>`;

    document.getElementById('pageTitle').textContent = '查看生产订单';
    document.getElementById('content').innerHTML = html;
    document.getElementById('content').scrollTop = 0;
}

// 详情字段项（label + value，空值显示 -）
function poDetailItem(label, value) {
    const v = (value === undefined || value === null || value === '') ? '-' : value;
    return `<div class="detail-item"><span class="detail-label">${label}</span><span class="detail-value">${v}</span></div>`;
}

// ===== 生产订单：编辑/添加表单页（独立页面） =====
function poEdit(id) {
    const config = PAGE_CONFIG['production-order'];
    const isNew = !id;
    const row = isNew ? {} : getPoById(id);
    currentPage = 'production-order-edit';

    let html = '';
    // 顶部：返回图标 + 标题 + 保存/取消
    html += `<div class="detail-topbar">
        <button class="back-icon" onclick="navigateTo('production-order','生产订单')" title="返回">‹</button>
        <span class="detail-title">${isNew ? '新增生产订单' : '编辑生产订单'}</span>
        <span class="detail-actions">
            <button class="btn" onclick="navigateTo('production-order','生产订单')">取消</button>
            <button class="btn btn-primary" onclick="poSave(${isNew ? 0 : id})">保存</button>
        </span>
    </div>`;

    // 表单卡片
    html += `<div class="card">
        <div class="card-header"><span class="card-title">${isNew ? '新增' : '编辑'}订单</span></div>
        <div class="card-body">
            <div class="form-grid">
                ${poFormItem('客户单号', 'customerOrderNo', row.customerOrderNo || '', 'text', false, isNew ? '' : 'readonly')}
                ${poFormItem('内部工单号', 'orderNo', row.orderNo || '', 'text', false, isNew ? '可留空，后端自动生成' : 'readonly')}
                ${poFormSelect('客户', 'customer', config.customerOptions, row.customer, true)}
                ${poFormSelect('产线', 'line', config.lineOptions, row.line || '', true)}
                ${poFormSelect('产品', 'product', config.productOptions, row.productName ? `${row.productName}(${row.productCode})` : '', true)}
                ${poFormItem('生产数量', 'quantity', row.quantity ?? 1, 'number', true)}
                ${poFormItem('要求交付日期', 'deliveryDate', row.deliveryDate || '', 'date', false)}
                ${poFormItem('计划开始日期', 'planStart', row.planStart || '', 'date', false)}
                ${poFormItem('计划结束日期', 'planEnd', row.planEnd || '', 'date', false)}
                ${poFormRadio('订单类型', 'orderType', ['普通订单','返工订单'], row.type === '返工' ? '返工订单' : '普通订单', true)}
                ${poFormSelect('负责人', 'owner', config.ownerOptions, row.creator || '', true)}
                ${poFormSwitch('是否加急', 'urgent', row.urgent === '是')}
                ${poFormTextarea('备注', 'remark', row.remark || '', false)}
            </div>
        </div>
    </div>`;

    document.getElementById('pageTitle').textContent = isNew ? '新增生产订单' : '编辑生产订单';
    document.getElementById('content').innerHTML = html;
    document.getElementById('content').scrollTop = 0;
}

// 表单组件
function poFormItem(label, name, value, type, required, extra) {
    const req = required ? '<span class="req-star">*</span>' : '';
    const ro = (extra === 'readonly') ? 'readonly class="input-readonly"' : '';
    const ph = (extra && extra !== 'readonly') ? `placeholder="${extra}"` : '';
    return `<div class="form-item">
        <label class="form-label">${label}${req}</label>
        <input type="${type}" class="form-input" id="po-${name}" name="${name}" value="${value}" ${ro} ${ph} />
    </div>`;
}
function poFormSelect(label, name, options, selected, required) {
    const req = required ? '<span class="req-star">*</span>' : '';
    return `<div class="form-item">
        <label class="form-label">${label}${req}</label>
        <select class="form-input" id="po-${name}" name="${name}">
            <option value="">请选择${label}</option>
            ${options.map(o => `<option value="${o}" ${o === selected ? 'selected' : ''}>${o}</option>`).join('')}
        </select>
    </div>`;
}
function poFormRadio(label, name, options, selected, required) {
    const req = required ? '<span class="req-star">*</span>' : '';
    return `<div class="form-item">
        <label class="form-label">${label}${req}</label>
        <div class="form-radio-group">
            ${options.map(o => `<label class="form-radio"><input type="radio" name="${name}" value="${o}" ${o === selected ? 'checked' : ''} /><span>${o}</span></label>`).join('')}
        </div>
    </div>`;
}
function poFormSwitch(label, name, checked) {
    return `<div class="form-item">
        <label class="form-label">${label}</label>
        <div class="form-switch-wrap">
            <label class="form-switch"><input type="checkbox" id="po-${name}" ${checked ? 'checked' : ''} /><span class="form-switch-slider"></span></label>
            <span class="form-switch-text">${checked ? '是' : '否'}</span>
        </div>
    </div>`;
}
function poFormTextarea(label, name, value, required) {
    const req = required ? '<span class="req-star">*</span>' : '';
    return `<div class="form-item form-item-full">
        <label class="form-label">${label}${req}</label>
        <textarea class="form-input" id="po-${name}" name="${name}" rows="3">${value}</textarea>
    </div>`;
}

// 保存
function poSave(id) {
    // 校验必填
    const required = ['customer','line','product','quantity','owner'];
    const labels = { customer:'客户', line:'产线', product:'产品', quantity:'生产数量', owner:'负责人' };
    for (const f of required) {
        const el = document.getElementById('po-' + f);
        if (el && !String(el.value).trim()) {
            showMsg(`请填写【${labels[f]}】`, 'error');
            el.focus();
            return;
        }
    }

    // 读取表单值
    const val = (f) => { const el = document.getElementById('po-' + f); return el ? el.value.trim() : ''; };
    const urgentEl = document.getElementById('po-urgent');
    const urgentOn = urgentEl ? urgentEl.checked : false;
    // 产品下拉值格式：名称(编码)
    const productRaw = val('product');
    const pm = productRaw.match(/^(.*)\((.+)\)$/);
    const productName = pm ? pm[1] : productRaw;
    const productCode = pm ? pm[2] : '';
    // 订单类型为 radio 组（无 id），按 name 读取选中项
    const orderTypeEl = document.querySelector('input[name="orderType"]:checked');
    const typeStr = (orderTypeEl && orderTypeEl.value === '返工订单') ? '返工' : '正常';

    const config = PAGE_CONFIG['production-order'];

    if (id) {
        // 编辑：更新数据源对应记录
        const row = getPoById(id);
        if (row) {
            row.customerOrderNo = val('customerOrderNo') || row.customerOrderNo;
            row.customer = val('customer');
            row.line = val('line');
            row.productName = productName;
            row.productCode = productCode || row.productCode;
            row.quantity = parseInt(val('quantity'), 10) || row.quantity;
            row.deliveryDate = val('deliveryDate') || row.deliveryDate;
            row.planStart = val('planStart');
            row.planEnd = val('planEnd');
            row.type = typeStr;
            row.urgent = urgentOn ? '是' : '否';
            row.creator = val('owner');
            row.remark = val('remark');
        }
    } else {
        // 新增：构造完整工单记录，插入列表开头
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        const qty = parseInt(val('quantity'), 10) || 1;
        const maxId = config.data.reduce((m, r) => Math.max(m, r.id || 0), 0);
        config.data.unshift({
            id: maxId + 1,
            customerOrderNo: val('customerOrderNo') || 'PO-2026-' + String(maxId + 1).padStart(4, '0'),
            orderNo: val('orderNo') || ('MO' + ts.replace(/[-: ]/g, '').slice(0, 11)),
            productCode: productCode || 'NEW',
            productName: productName,
            quantity: qty,
            deliveryDate: val('deliveryDate') || '',
            urgent: urgentOn ? '是' : '否',
            type: typeStr,
            finishStatus: '未完成',
            route: config.routeOptions[0],
            creator: val('owner'),
            createTime: ts,
            qualified: 0,
            unqualified: 0,
            remark: val('remark'),
            customer: val('customer'),
            line: val('line'),
            nodes: [
                { name: '来料检验', pct: 0, planQty: qty, doneQty: 0, planStart: val('planStart'), planEnd: val('planStart'), actualStart: '', actualEnd: '', desc: '' },
                { name: '上挂', pct: 0, planQty: qty, doneQty: 0, planStart: '', planEnd: '', actualStart: '', actualEnd: '', desc: '' },
                { name: '电泳', pct: 0, planQty: qty, doneQty: 0, planStart: '', planEnd: '', actualStart: '', actualEnd: '', desc: '' },
                { name: '喷粉', pct: 0, planQty: qty, doneQty: 0, planStart: '', planEnd: '', actualStart: '', actualEnd: '', desc: '' },
                { name: '下挂', pct: 0, planQty: qty, doneQty: 0, planStart: val('planEnd'), planEnd: val('planEnd'), actualStart: '', actualEnd: '', desc: '' },
                { name: '成品入库检', pct: 0, planQty: qty, doneQty: 0, planStart: '', planEnd: '', actualStart: '', actualEnd: '', desc: '' },
            ]
        });
    }

    showMsg(id ? '保存成功' : '新增成功', 'success');
    navigateTo('production-order', '生产订单');
}

// 更多菜单项点击
function poMenuAction(action, id) {
    closePoMore();
    // 设置工艺路线：打开专用弹窗（订单信息 + 工艺路线选择 + 工序预览）
    if (action === '设置工艺路线') { poShowRouteModal(id); return; }
    // 结案：打开结案确认弹窗（订单信息 + 进度汇总 + 风险提示）
    if (action === '结案') { poShowCloseModal(id); return; }
    // 下发任务 / 撤回任务：简单确认弹窗（仿目标图1：标题 + 提示语 + 取消/确定）
    if (action === '下发任务') { poShowDispatchModal(id, 'dispatch'); return; }
    if (action === '撤回任务') { poShowDispatchModal(id, 'withdraw'); return; }
    // 报工：二维码弹窗（仿目标图2：标题 + 订单编号 + 大二维码 + 引导语 + 关闭）
    if (action === '报工') { poShowQrModal(id); return; }
    // 打印：不做真实打印，仅提示成功
    if (action === '打印') { showMsg('打印成功'); return; }
    alert(action);
}

// ============================================================
// 生产订单：下发/撤回任务确认弹窗（更多 → 下发任务 / 撤回任务）
// 仿目标图1的简单样式：图标+标题、居中提示语（订单号蓝色高亮）、取消/确定
// 确定后仅提示成功，不改动订单数据（原型演示）
// ============================================================

function poShowDispatchModal(id, kind) {
    const row = getPoById(id);
    if (!row) { showMsg('未找到该生产订单', 'error'); return; }
    window._poDispatch = { id, kind };
    const isDispatch = kind === 'dispatch';
    const title = isDispatch ? '确认下发' : '确认撤回';
    const msg = `确定要${isDispatch ? '下发' : '撤回'}生产订单 <b class="po-confirm-order">${row.orderNo}</b> 的生产任务吗？`;
    const html = `<div class="modal-overlay" onclick="closeModal(event)">
        <div class="modal po-confirm-modal" onclick="event.stopPropagation()">
            <div class="modal-header">
                <span class="modal-title po-route-title"><span class="po-route-title-ico ${isDispatch ? '' : 'po-ico-orange'}">${isDispatch ? '📤' : '↩️'}</span>${title}</span>
                <span class="modal-close" onclick="closeModalDirect()">×</span>
            </div>
            <div class="modal-body"><div class="po-confirm-msg">${msg}</div></div>
            <div class="modal-footer">
                <button class="btn" onclick="closeModalDirect()">取 消</button>
                <button class="btn btn-primary" onclick="poDoDispatch()">确 定</button>
            </div>
        </div>
    </div>`;
    document.getElementById('modalContainer').innerHTML = html;
}

// 确认下发/撤回：关闭弹窗并提示成功（不改数据）
function poDoDispatch() {
    const ctx = window._poDispatch;
    closeModalDirect();
    window._poDispatch = null;
    if (!ctx) return;
    showMsg(ctx.kind === 'dispatch' ? '任务已下发' : '任务已撤回');
}

// ============================================================
// 生产订单：报工二维码弹窗（更多 → 报工）
// 仿目标图2：标题"生产订单报工二维码" + 订单编号（固定示例 MO20260821005）
// + 大尺寸二维码 + "扫描二维码进行报工" + 关闭按钮
// 二维码为原型演示图案（按编号生成固定的伪随机模块，无真实编码信息）
// ============================================================

// 生成演示用二维码 SVG：三个定位角 + 校正图形 + 时序线 + 伪随机数据模块
function poQrSvg(text, size) {
    const N = 25;                       // 模块数（version 2 规格）
    const cell = size / N;
    // 由编号生成固定伪随机序列（同一编号每次生成相同图案）
    let seed = 0;
    for (let i = 0; i < text.length; i++) seed = (seed * 31 + text.charCodeAt(i)) >>> 0;
    const rand = () => { seed = (seed * 1103515245 + 12345) >>> 0; return (seed >>> 16) / 65536; };

    // 三个定位角（7×7）位置：左上 / 右上 / 左下
    const FINDERS = [[0, 0], [0, N - 7], [N - 7, 0]];
    const inFinder = (r, c) => FINDERS.some(([r0, c0]) => r >= r0 && r < r0 + 7 && c >= c0 && c < c0 + 7);
    // 定位角内部深色：外环 + 中心 3×3
    const finderDark = (r, c) => {
        const [r0, c0] = FINDERS.find(([rr, cc]) => r >= rr && r < rr + 7 && c >= cc && c < cc + 7);
        const dr = r - r0, dc = c - c0;
        return (dr === 0 || dr === 6 || dc === 0 || dc === 6) || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4);
    };
    // 定位角外圈 1 模块白色分隔环
    const inSeparator = (r, c) => FINDERS.some(([r0, c0]) =>
        r >= r0 - 1 && r <= r0 + 7 && c >= c0 - 1 && c <= c0 + 7 && !(r >= r0 && r < r0 + 7 && c >= c0 && c < c0 + 7));
    // 校正图形（5×5）右下区域
    const AR = 16, AC = 16;
    const inAlign = (r, c) => r >= AR && r < AR + 5 && c >= AC && c < AC + 5;
    const alignDark = (r, c) => {
        const dr = r - AR, dc = c - AC;
        return (dr === 0 || dr === 4 || dc === 0 || dc === 4) || (dr === 2 && dc === 2);
    };
    // 时序线：第6行/第6列黑白交替
    const inTiming = (r, c) => (r === 6 && c >= 8 && c <= N - 9) || (c === 6 && r >= 8 && r <= N - 9);

    let rects = '';
    for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
            let dark;
            if (inSeparator(r, c)) continue;                                   // 白色分隔环留白
            else if (inFinder(r, c)) dark = finderDark(r, c);
            else if (inAlign(r, c)) dark = alignDark(r, c);
            else if (inTiming(r, c)) dark = (r === 6 ? c : r) % 2 === 0;
            else dark = rand() > 0.5;
            if (dark) rects += `<rect x="${(c * cell).toFixed(2)}" y="${(r * cell).toFixed(2)}" width="${cell.toFixed(2)}" height="${cell.toFixed(2)}" fill="#1a1a1a"/>`;
        }
    }
    return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" role="img" aria-label="报工二维码"><rect width="${size}" height="${size}" fill="#ffffff"/>${rects}</svg>`;
}

// 打开报工二维码弹窗
function poShowQrModal(id) {
    const orderNo = 'MO20260821005'; // 固定示例编号（与目标图2一致，原型演示）
    const html = `<div class="modal-overlay" onclick="closeModal(event)">
        <div class="modal po-qr-modal" onclick="event.stopPropagation()">
            <div class="modal-header">
                <span class="modal-title po-route-title"><span class="po-route-title-ico">📱</span>生产订单报工二维码</span>
                <span class="modal-close" onclick="closeModalDirect()">×</span>
            </div>
            <div class="modal-body">
                <div class="po-qr-order">订单编号：<b>${orderNo}</b></div>
                <div class="po-qr-img">${poQrSvg(orderNo, 240)}</div>
                <div class="po-qr-hint">扫描二维码进行报工</div>
            </div>
            <div class="modal-footer">
                <button class="btn" onclick="closeModalDirect()">关 闭</button>
            </div>
        </div>
    </div>`;
    document.getElementById('modalContainer').innerHTML = html;
}

// ============================================================
// 生产订单：结案确认弹窗（更多 → 结案）
// 关键信息颜色提示：工单号(蓝) 数量(紫) 交付日期(橙)
// 进度条分色：100%绿 / ≥80%蓝 / ≥50%橙 / <50%红
// 已完成工序(绿) 未完成工序(红) 合格数(绿) 不合格数(红)
// 未完成工序>0 时红色警示条；全部完成时绿色安全提示
// ============================================================

// 订单整体进度：各工序平均完成率
function poOverallPct(row) {
    const nodes = row.nodes || [];
    if (!nodes.length) return 0;
    return Math.round(nodes.reduce((s, n) => s + (n.pct || 0), 0) / nodes.length);
}

// 进度值 → 进度条颜色 class
function poPctCls(pct) {
    if (pct >= 100) return 'ok';
    if (pct >= 80) return 'mid';
    if (pct >= 50) return 'warn';
    return 'bad';
}

// 打开结案确认弹窗
function poShowCloseModal(id) {
    const row = getPoById(id);
    if (!row) { showMsg('未找到该生产订单', 'error'); return; }
    // 已结案订单：不重复打开弹窗，直接提示
    if (row.finishStatus === '已完成') { showMsg(`订单 ${row.orderNo} 已结案，无需重复操作`, 'error'); return; }
    window._poCloseId = id;

    const nodes = row.nodes || [];
    const pct = poOverallPct(row);
    const pctCls = poPctCls(pct);
    const doneCnt = nodes.filter(n => (n.pct || 0) >= 100).length;
    const undoneCnt = nodes.length - doneCnt;
    const badQty = row.unqualified || 0;

    // 进度汇总条（进度条 + 彩色统计）
    const progressHtml = `<div class="po-close-progress">
        <div class="po-close-progress-head">
            <span class="po-close-progress-title">订单整体进度</span>
            <span class="po-close-pct ${pctCls}">${pct}%</span>
        </div>
        <div class="po-close-bar"><div class="po-close-bar-fill ${pctCls}" style="width:${pct}%"></div></div>
        <div class="po-close-stats">
            <div class="po-close-stat"><span class="po-close-stat-k">总工序数</span><span class="po-close-stat-v">${nodes.length}</span></div>
            <div class="po-close-stat"><span class="po-close-stat-k">已完成工序</span><span class="po-close-stat-v ok">${doneCnt}</span></div>
            <div class="po-close-stat"><span class="po-close-stat-k">未完成工序</span><span class="po-close-stat-v ${undoneCnt > 0 ? 'bad' : 'ok'}">${undoneCnt}</span></div>
            <div class="po-close-stat"><span class="po-close-stat-k">合格数</span><span class="po-close-stat-v ok">${row.qualified != null ? row.qualified : 0}</span></div>
            <div class="po-close-stat"><span class="po-close-stat-k">不合格数</span><span class="po-close-stat-v ${badQty > 0 ? 'bad' : ''}">${badQty}</span></div>
        </div>
    </div>`;

    // 风险提示：有未完成工序 → 红色强警示；全部完成 → 绿色安全提示
    const warnHtml = undoneCnt > 0
        ? `<div class="po-close-warn block"><span class="po-close-warn-ico">⛔</span><div>
            <div class="po-close-warn-title">当前进度 ${pct}%，仍有 <b>${undoneCnt}</b> 道工序未完成，确认结案吗？</div>
            <ul class="po-close-warn-list">
                <li>结案后未完成工序将<b>无法继续执行与报工</b>；</li>
                <li>订单将归档为「已完成」状态，<b>不可恢复、不可再编辑</b>；</li>
                <li>无法再对该订单下发/撤回任务与追加生产。</li>
            </ul>
        </div></div>`
        : `<div class="po-close-warn safe"><span class="po-close-warn-ico">✅</span><div>
            <div class="po-close-warn-title">该订单全部工序已完成，可安全结案。</div>
            <ul class="po-close-warn-list"><li>结案后订单将归档为「已完成」状态，不可恢复。</li></ul>
        </div></div>`;

    // 状态流转预览：未完成 → 已完成
    const statusHtml = `<div class="po-close-status">
        <span class="po-close-status-k">完成状态变更</span>
        <span class="po-status-ing">未完成</span>
        <span class="po-close-status-arrow">→</span>
        <span class="po-status-done">已完成</span>
    </div>`;

    const html = `<div class="modal-overlay" onclick="closeModal(event)">
        <div class="modal po-close-modal" onclick="event.stopPropagation()">
            <div class="modal-header">
                <span class="modal-title po-route-title"><span class="po-route-title-ico po-close-ico">🏁</span>结案确认</span>
                <span class="modal-close" onclick="closeModalDirect()">×</span>
            </div>
            <div class="modal-body">
                <div class="po-route-order">
                    <div class="po-route-order-item"><span class="po-route-k">内部工单号</span><span class="po-route-v code" title="${row.orderNo || '-'}">${row.orderNo || '-'}</span></div>
                    <div class="po-route-order-item"><span class="po-route-k">客户单号</span><span class="po-route-v" title="${row.customerOrderNo || '-'}">${row.customerOrderNo || '-'}</span></div>
                    <div class="po-route-order-item"><span class="po-route-k">产品名称</span><span class="po-route-v" title="${row.productName || '-'}">${row.productName || '-'}</span></div>
                    <div class="po-route-order-item"><span class="po-route-k">生产数量</span><span class="po-route-v qty">${row.quantity != null ? row.quantity : '-'}</span></div>
                    <div class="po-route-order-item"><span class="po-route-k">交付日期</span><span class="po-route-v date">${row.deliveryDate || '-'}</span></div>
                </div>
                ${progressHtml}
                ${statusHtml}
                ${warnHtml}
            </div>
            <div class="modal-footer">
                <button class="btn" onclick="closeModalDirect()">取 消</button>
                <button class="btn btn-danger" onclick="poDoClose()">确认结案</button>
            </div>
        </div>
    </div>`;
    document.getElementById('modalContainer').innerHTML = html;
}

// 执行结案（写回订单状态并刷新列表）
function poDoClose() {
    const row = getPoById(window._poCloseId);
    if (!row) { closeModalDirect(); return; }
    if (row.finishStatus === '已完成') {
        closeModalDirect();
        showMsg(`订单 ${row.orderNo} 已结案，无需重复操作`, 'error');
        return;
    }
    row.finishStatus = '已完成';
    closeModalDirect();
    navigateTo('production-order', '生产订单');
    showMsg(`订单 ${row.orderNo} 已结案归档`);
}

// ============================================================
// 生产订单：设置工艺路线弹窗（更多 → 设置工艺路线）
// 布局仿目标效果图：横向表单（label 右对齐）+ 只读订单编号 + 工艺路线下拉
// 关键信息颜色提示：订单编号(蓝) 数量(紫) 交付日期(橙) 当前路线(青)
// 选择路线后自动预览工序流程（质检绿 / 前处理青 / 涂装蓝）
// ============================================================

// 工艺路线下拉选项：现有订单已用路线 + 工艺路线库（工序管理-工艺路线）
function poRouteOptions() {
    const used = [];
    (PAGE_CONFIG['production-order'].data || []).forEach(d => {
        if (d.route && !used.includes(d.route)) used.push(d.route);
    });
    ((PAGE_CONFIG['process-route'] || {}).data || []).forEach(r => {
        if (r.name && !used.includes(r.name)) used.push(r.name);
    });
    return used;
}

// 路线 → 工序名列表（优先取工艺路线库的工序明细，否则按“+”拆分）
function poRouteStepNames(route) {
    if (!route) return [];
    const lib = (PAGE_CONFIG['process-route'] || {}).data || [];
    const hit = lib.find(r => r.name === route);
    if (hit && hit.steps && hit.steps.length) return hit.steps.map(s => s.name);
    return String(route).split('+').map(s => s.trim()).filter(Boolean);
}

// 工序类型 → 颜色分类（质检=绿 / 前处理=青 / 涂装=蓝 / 其他=紫）
function poRouteStepCls(name) {
    if (/检|验/.test(name)) return 'qc';
    if (/打磨|退漆|前处理|上挂|下挂|挂件|防涂|包装|入库/.test(name)) return 'prep';
    if (/电泳|喷|涂|固化|烘烤|冷却/.test(name)) return 'paint';
    return 'other';
}

// 工序预览：彩色流程 chips + 工序数统计
function poRoutePreview(route) {
    const box = document.getElementById('po-route-steps');
    if (!box) return;
    const sel = document.getElementById('po-route-select');
    if (sel) sel.classList.remove('form-control-error');
    const names = poRouteStepNames(route);
    const cnt = document.getElementById('po-route-count');
    if (cnt) cnt.textContent = names.length ? `共 ${names.length} 道工序` : '';
    if (!names.length) {
        box.innerHTML = `<span class="po-route-steps-empty">请先在上方选择工艺路线</span>`;
        return;
    }
    box.innerHTML = names.map((n, i) =>
        `${i > 0 ? '<span class="po-route-arrow">›</span>' : ''}<span class="po-route-chip ${poRouteStepCls(n)}" title="${n}">${n}</span>`
    ).join('');
}

// 打开设置工艺路线弹窗
function poShowRouteModal(id) {
    const row = getPoById(id);
    if (!row) { showMsg('未找到该生产订单', 'error'); return; }
    window._poRouteId = id;
    const optHtml = ['<option value="">请选择工艺路线</option>'].concat(poRouteOptions().map(r =>
        `<option value="${r}" ${r === row.route ? 'selected' : ''}>${r}</option>`)).join('');
    const html = `<div class="modal-overlay" onclick="closeModal(event)">
        <div class="modal po-route-modal" onclick="event.stopPropagation()">
            <div class="modal-header">
                <span class="modal-title po-route-title"><span class="po-route-title-ico">🗺️</span>设置工艺路线</span>
                <span class="modal-close" onclick="closeModalDirect()">×</span>
            </div>
            <div class="modal-body">
                <div class="po-route-order">
                    <div class="po-route-order-item"><span class="po-route-k">产品编码</span><span class="po-route-v code" title="${row.productCode || '-'}">${row.productCode || '-'}</span></div>
                    <div class="po-route-order-item"><span class="po-route-k">产品名称</span><span class="po-route-v" title="${row.productName || '-'}">${row.productName || '-'}</span></div>
                    <div class="po-route-order-item"><span class="po-route-k">生产数量</span><span class="po-route-v qty">${row.quantity != null ? row.quantity : '-'}</span></div>
                    <div class="po-route-order-item"><span class="po-route-k">交付日期</span><span class="po-route-v date">${row.deliveryDate || '-'}</span></div>
                    <div class="po-route-order-item"><span class="po-route-k">当前路线</span><span class="po-route-v route" title="${row.route || '-'}">${row.route || '-'}</span></div>
                </div>
                <div class="po-route-form">
                    <div class="po-route-field">
                        <label class="po-route-label">生产订单编号</label>
                        <div class="po-route-control">
                            <input type="text" class="form-input po-route-readonly" value="${row.orderNo || '-'}" readonly />
                        </div>
                    </div>
                    <div class="po-route-field">
                        <label class="po-route-label"><span class="required">*</span>工艺路线</label>
                        <div class="po-route-control">
                            <select class="form-select" id="po-route-select" onchange="poRoutePreview(this.value)">${optHtml}</select>
                        </div>
                    </div>
                </div>
                <div class="po-route-steps-box">
                    <div class="po-route-steps-title">路线工序预览<span class="po-route-steps-sub">选择工艺路线后自动带出</span><span class="po-route-chip-count" id="po-route-count"></span></div>
                    <div class="po-route-steps" id="po-route-steps"></div>
                </div>
                <div class="po-route-tip"><span>⚠</span><span>保存后订单将按所选工艺路线的工序安排生产，请确认路线与产品工艺匹配后再确定。</span></div>
            </div>
            <div class="modal-footer">
                <button class="btn" onclick="closeModalDirect()">取 消</button>
                <button class="btn btn-primary" onclick="poSaveRoute()">确 定</button>
            </div>
        </div>
    </div>`;
    document.getElementById('modalContainer').innerHTML = html;
    poRoutePreview(row.route || '');
}

// 保存工艺路线（写回订单数据并刷新列表）
function poSaveRoute() {
    const row = getPoById(window._poRouteId);
    if (!row) { closeModalDirect(); return; }
    const sel = document.getElementById('po-route-select');
    const val = sel ? sel.value.trim() : '';
    if (!val) {
        sel.classList.add('form-control-error');
        sel.focus();
        showMsg('请选择工艺路线', 'error');
        return;
    }
    const old = row.route || '无';
    row.route = val;
    closeModalDirect();
    navigateTo('production-order', '生产订单');
    showMsg(val === old ? `工艺路线已确认：${val}` : `工艺路线已更新：${old} → ${val}`);
}

// 删除（通用确认弹窗）
function poDelete(id) {
    showDeleteConfirm({
        title: '确认删除吗',
        desc: '删除后不可恢复，是否继续？',
        onConfirm: function() {
            const d = PAGE_CONFIG['production-order'].data;
            const i = d.findIndex(x => x.id === id);
            if (i > -1) d.splice(i, 1);
            navigateTo('production-order', '生产订单');
        }
    });
}

// 通用消息提示（toast）
function showMsg(text, type) {
    // 移除已存在的提示
    document.querySelectorAll('.msg-toast').forEach(t => t.remove());
    const toast = document.createElement('div');
    toast.className = 'msg-toast ' + (type === 'error' ? 'msg-toast-error' : 'msg-toast-success');
    toast.textContent = text;
    document.body.appendChild(toast);
    // 300ms 后开始淡出，1.8s 后移除
    setTimeout(() => { toast.classList.add('msg-toast-hide'); }, 1600);
    setTimeout(() => { toast.remove(); }, 2000);
}

// ============================================================
// 生产任务模块（参照真实系统 /processTask/list）
// 状态机: NOT_ASSIGNED → ASSIGNED → IN_PROGRESS ⇄ PAUSED → COMPLETED
// ============================================================

// 状态 → 中文 + 标签样式class
function ptStatusBadge(status) {
    const map = PAGE_CONFIG['production-task'].statusMap;
    const clsMap = { 'NOT_ASSIGNED': 'pt-tag-wait', 'ASSIGNED': 'pt-tag-assigned', 'IN_PROGRESS': 'pt-tag-doing', 'PAUSED': 'pt-tag-paused', 'COMPLETED': 'pt-tag-done' };
    return `<span class="pt-tag ${clsMap[status] || ''}">${map[status] || status}</span>`;
}

function getPtById(id) {
    return PAGE_CONFIG['production-task'].data.find(t => t.id === id);
}

// 列表页：搜索区 + 13列表格（操作列固定右侧）
function renderProcessTaskPage() {
    const config = PAGE_CONFIG['production-task'];
    let html = '';

    // 搜索区
    html += `<div class="search-bar">`;
    config.search.forEach(s => {
        html += `<div class="search-item">`;
        html += `<span class="search-label">${s.label}</span>`;
        if (s.type === 'select') {
            html += `<select class="search-select" id="search-${s.name}">`;
            s.options.forEach(opt => { html += `<option value="${opt}">${opt}</option>`; });
            html += `</select>`;
        } else {
            html += `<input type="text" class="search-input" id="search-${s.name}" placeholder="${s.placeholder || '请输入'}" />`;
        }
        html += `</div>`;
    });
    config.searchButtons.forEach(btn => {
        const cls = btn.type === 'primary' ? 'btn-primary' : '';
        html += `<div class="search-item"><button class="btn ${cls}" onclick="handleButton('${btn.action}', '${config.title}')">${btn.text}</button></div>`;
    });
    html += `</div>`;

    // 工具栏
    html += `<div class="toolbar">`;
    config.buttons.forEach(btn => {
        const cls = btn.type === 'primary' ? 'btn-primary' : '';
        html += `<button class="btn ${cls}" onclick="handleButton('${btn.action}', '${config.title}')">${btn.text}</button>`;
    });
    html += `</div>`;

    // 13列表格（列顺序与真实系统一致，操作列固定右侧）
    html += `<div class="table-wrapper pt-table-wrapper"><table class="po-table pt-table">`;
    html += `<thead><tr>
        <th>生产订单编号</th>
        <th>产品编码</th>
        <th>产品名称</th>
        <th>工序名称</th>
        <th>工序描述</th>
        <th>任务数量</th>
        <th>处理人</th>
        <th>客户单号</th>
        <th>客户名称</th>
        <th>要求交付日期</th>
        <th>已完成数量</th>
        <th>状态</th>
        <th>创建时间</th>
        <th class="po-fix-right">操作</th>
    </tr></thead>`;
    html += `<tbody id="tableBody">`;
    const rows = window._ptFiltered || config.data;
    rows.forEach((row) => {
        html += `<tr>`;
        html += `<td class="po-mono">${row.productionOrderSn}</td>`;      // 生产订单编号
        html += `<td class="po-mono">${row.productCode}</td>`;            // 产品编码
        html += `<td>${row.productName}</td>`;                            // 产品名称
        html += `<td>${row.processName}</td>`;                            // 工序名称
        html += `<td class="pt-desc">${row.description || '-'}</td>`;     // 工序描述
        html += `<td class="po-num">${row.quantity}</td>`;                // 任务数量
        html += `<td>${row.assignedWorkerName || '-'}</td>`;              // 处理人
        html += `<td class="po-mono">${row.customerOrderNo || '-'}</td>`; // 客户单号
        html += `<td>${row.partnerName}</td>`;                            // 客户名称
        html += `<td>${row.deliveryDate || '-'}</td>`;                    // 要求交付日期
        html += `<td class="po-num">${row.completedQuantity}</td>`;       // 已完成数量
        html += `<td>${ptStatusBadge(row.status)}</td>`;                  // 状态
        html += `<td class="po-mono">${row.createTime}</td>`;             // 创建时间
        // 操作列：编辑 查看 + 按状态流转按钮（与真实系统一致）
        html += `<td class="po-actions po-fix-right">
            <button class="btn-text-link" onclick="ptEdit(${row.id})">编辑</button>
            <button class="btn-text-link" onclick="ptView(${row.id})">查看</button>
            ${row.status === 'NOT_ASSIGNED' ? `<button class="btn-text-link" onclick="ptOpenAssign(${row.id})">指派任务</button>` : ''}
            ${row.status === 'ASSIGNED' ? `<button class="btn-text-link" onclick="ptStart(${row.id})">开始任务</button>` : ''}
            ${row.status === 'IN_PROGRESS' ? `<button class="btn-text-link" onclick="ptPause(${row.id})">暂停任务</button>` : ''}
            ${row.status === 'PAUSED' ? `<button class="btn-text-link" onclick="ptResume(${row.id})">恢复任务</button>` : ''}
        </td>`;
        html += `</tr>`;
    });
    html += `</tbody></table></div>`;

    // 分页
    html += renderPagination(rows.length);
    return html;
}

// 状态流转操作（更新数据源 + 提示，与真实系统消息一致）
function ptOpenAssign(id) {
    const t = getPtById(id);
    if (!t) return;
    closePoMore();
    const config = PAGE_CONFIG['production-task'];
    let html = `<div class="modal-overlay" onclick="if(event.target===this)closeModalDirect()">
        <div class="modal pt-assign-box">
            <div class="modal-header"><span class="modal-title">指派任务</span><span class="modal-close" onclick="closeModalDirect()">×</span></div>
            <div class="modal-body">
                <div class="form-item">
                    <label class="form-label">工序名称</label>
                    <input type="text" class="form-input input-readonly" value="${t.processName}" readonly />
                </div>
                <div class="form-item" style="margin-top:14px;">
                    <label class="form-label">指派人员<span class="req-star">*</span></label>
                    <select class="form-input" id="pt-assign-worker">
                        <option value="">请选择人员</option>
                        ${config.workerOptions.map(w => `<option value="${w}">${w}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn" onclick="closeModalDirect()">取消</button>
                <button class="btn btn-primary" onclick="ptSubmitAssign(${t.id})">确定</button>
            </div>
        </div>
    </div>`;
    document.getElementById('modalContainer').innerHTML = html;
}

function ptSubmitAssign(id) {
    const t = getPtById(id);
    const worker = document.getElementById('pt-assign-worker');
    if (!t || !worker) return;
    if (!worker.value) { showMsg('请选择指派人员', 'error'); worker.focus(); return; }
    t.assignedWorkerName = worker.value;
    t.status = 'ASSIGNED';
    closeModal();
    showMsg('指派成功', 'success');
    navigateTo('production-task', '生产任务');
}

function ptStart(id) {
    const t = getPtById(id);
    if (!t) return;
    t.status = 'IN_PROGRESS';
    if (!t.actualStartDate) {
        const now = new Date();
        t.actualStartDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    }
    showMsg('任务已开始', 'success');
    navigateTo('production-task', '生产任务');
}

function ptPause(id) {
    const t = getPtById(id);
    if (!t) return;
    t.status = 'PAUSED';
    showMsg('任务已暂停', 'success');
    navigateTo('production-task', '生产任务');
}

function ptResume(id) {
    const t = getPtById(id);
    if (!t) return;
    t.status = 'IN_PROGRESS';
    showMsg('任务已恢复', 'success');
    navigateTo('production-task', '生产任务');
}

// ===== 编辑页：只读字段灰显 + 可改计划日期 + 工艺指导上传（参照真实系统） =====
function ptEdit(id) {
    const t = getPtById(id);
    if (!t) return;
    const config = PAGE_CONFIG['production-task'];
    currentPage = 'production-task-edit';

    const roItem = (label, val) => `<div class="form-item">
        <label class="form-label">${label}</label>
        <input type="text" class="form-input input-readonly" value="${val ?? ''}" readonly />
    </div>`;

    let html = '';
    html += `<div class="detail-topbar">
        <button class="back-icon" onclick="navigateTo('production-task','生产任务')" title="返回">‹</button>
        <span class="detail-title">编辑生产任务</span>
        <span class="detail-title-tags">${ptStatusBadge(t.status)}</span>
        <span class="detail-actions">
            <button class="btn" onclick="navigateTo('production-task','生产任务')">取消</button>
            <button class="btn btn-primary" onclick="ptSave(${t.id})">保存</button>
        </span>
    </div>`;

    html += `<div class="card">
        <div class="card-header"><span class="card-title">任务信息</span></div>
        <div class="card-body">
            <div class="form-grid">
                ${roItem('生产订单编号', t.productionOrderSn)}
                ${roItem('产品编码', t.productCode)}
                ${roItem('产品名称', t.productName)}
                ${roItem('工序名称', t.processName)}
            </div>
            <div class="form-item form-item-full" style="margin-top:16px;">
                <label class="form-label">工序描述</label>
                <textarea class="form-input input-readonly" rows="2" readonly>${t.description || ''}</textarea>
            </div>
            <div class="form-grid" style="margin-top:16px;">
                ${roItem('任务数量', t.quantity)}
                ${roItem('已完成数量', t.completedQuantity)}
                ${roItem('状态', config.statusMap[t.status] || t.status)}
                ${roItem('处理人', t.assignedWorkerName || '-')}
            </div>
            <div class="form-grid" style="margin-top:16px;">
                ${poFormItem('计划开始日期', 'plannedStartDate', t.plannedStartDate || '', 'date', false)}
                ${poFormItem('计划结束日期', 'plannedEndDate', t.plannedEndDate || '', 'date', false)}
                ${roItem('实际开始日期', t.actualStartDate || '-')}
                ${roItem('实际结束日期', t.actualEndDate || '-')}
            </div>
            <div class="form-item form-item-full" style="margin-top:16px;">
                <label class="form-label">工艺指导</label>
                <div class="pt-guide">
                    <button class="btn btn-primary btn-sm" onclick="ptUploadGuide(${t.id})"><span>⬆</span> 上传文件</button>
                    <span id="pt-guide-file">${t.processGuideFilePath ? `<a href="javascript:void(0)" class="pt-guide-link" onclick="alert('查看工艺指导文件')">${t.processGuideFilePath}</a><button class="btn-text-link danger" onclick="ptRemoveGuide(${t.id})">删除</button>` : '<span class="pt-guide-empty">支持 pdf/doc/xls/jpg/png 格式</span>'}</span>
                </div>
            </div>
        </div>
    </div>`;

    document.getElementById('pageTitle').textContent = '编辑生产任务';
    document.getElementById('content').innerHTML = html;
    document.getElementById('content').scrollTop = 0;
}

// 工艺指导：模拟上传/删除（原型行为）
function ptUploadGuide(id) {
    const t = getPtById(id);
    if (!t) return;
    t.processGuideFilePath = '/files/guide/' + t.processName + '_' + t.id + '.pdf';
    showMsg('上传成功', 'success');
    ptEdit(id);
}
function ptRemoveGuide(id) {
    const t = getPtById(id);
    if (!t) return;
    t.processGuideFilePath = '';
    showMsg('已删除', 'success');
    ptEdit(id);
}

function ptSave(id) {
    const t = getPtById(id);
    if (!t) return;
    const v = (f) => { const el = document.getElementById('po-' + f); return el ? el.value : ''; };
    const ps = v('plannedStartDate'), pe = v('plannedEndDate');
    if (ps && pe && ps > pe) { showMsg('计划开始日期不能晚于计划结束日期', 'error'); return; }
    t.plannedStartDate = ps;
    t.plannedEndDate = pe;
    showMsg('保存成功', 'success');
    navigateTo('production-task', '生产任务');
}

// ===== 查看页：全字段只读展示 =====
function ptView(id) {
    const t = getPtById(id);
    if (!t) return;
    const config = PAGE_CONFIG['production-task'];
    currentPage = 'production-task-view';

    const item = (l, v) => `<div class="detail-item"><span class="detail-label">${l}</span><span class="detail-value">${v ?? '-'}</span></div>`;

    let html = '';
    html += `<div class="detail-topbar">
        <button class="back-icon" onclick="navigateTo('production-task','生产任务')" title="返回">‹</button>
        <span class="detail-title">${t.productionOrderSn} - ${t.processName}</span>
        <span class="detail-title-tags">${ptStatusBadge(t.status)}</span>
        <span class="detail-actions">
            <button class="btn btn-primary" onclick="ptEdit(${t.id})">编辑</button>
        </span>
    </div>`;

    html += `<div class="card">
        <div class="card-header"><span class="card-title">任务信息</span></div>
        <div class="card-body">
            <div class="detail-grid">
                ${item('生产订单编号', t.productionOrderSn)}
                ${item('产品编码', t.productCode)}
                ${item('产品名称', t.productName)}
                ${item('工序名称', t.processName)}
                ${item('工序描述', t.description)}
                ${item('任务数量', t.quantity)}
                ${item('已完成数量', t.completedQuantity)}
                ${item('状态', config.statusMap[t.status] || t.status)}
                ${item('处理人', t.assignedWorkerName || '-')}
                ${item('客户单号', t.customerOrderNo || '-')}
                ${item('客户名称', t.partnerName)}
                ${item('要求交付日期', t.deliveryDate)}
                ${item('计划开始日期', t.plannedStartDate)}
                ${item('计划结束日期', t.plannedEndDate)}
                ${item('实际开始日期', t.actualStartDate)}
                ${item('实际结束日期', t.actualEndDate)}
                ${item('工艺指导', t.processGuideFilePath ? `<a href="javascript:void(0)" class="pt-guide-link" onclick="alert('查看工艺指导文件')">${t.processGuideFilePath}</a>` : '-')}
                ${item('创建时间', t.createTime)}
            </div>
        </div>
    </div>`;

    document.getElementById('pageTitle').textContent = '查看生产任务';
    document.getElementById('content').innerHTML = html;
    document.getElementById('content').scrollTop = 0;
}

// ============================================================
// 报工记录模块（参照真实系统 /workReport/list + view）
// ============================================================

function getWrById(id) {
    return PAGE_CONFIG['work-report'].data.find(r => r.id === id);
}

// 报工记录列表：11列 + 搜索区 + 操作（查看/删除）
function renderWorkReportPage() {
    const config = PAGE_CONFIG['work-report'];
    let html = '';

    // 搜索区
    html += `<div class="search-bar">`;
    config.search.forEach(s => {
        html += `<div class="search-item">`;
        html += `<span class="search-label">${s.label}</span>`;
        if (s.type === 'select') {
            html += `<select class="search-select" id="search-${s.name}">`;
            s.options.forEach(opt => { html += `<option value="${opt}">${opt}</option>`; });
            html += `</select>`;
        } else {
            html += `<input type="text" class="search-input" id="search-${s.name}" placeholder="${s.placeholder || '请输入'}" />`;
        }
        html += `</div>`;
    });
    config.searchButtons.forEach(btn => {
        const cls = btn.type === 'primary' ? 'btn-primary' : '';
        html += `<div class="search-item"><button class="btn ${cls}" onclick="handleButton('${btn.action}', '${config.title}')">${btn.text}</button></div>`;
    });
    html += `</div>`;

    // 工具栏
    html += `<div class="toolbar">`;
    config.buttons.forEach(btn => {
        const cls = btn.type === 'primary' ? 'btn-primary' : '';
        html += `<button class="btn ${cls}" onclick="handleButton('${btn.action}', '${config.title}')">${btn.text}</button>`;
    });
    html += `</div>`;

    // 11列表格（列顺序与真实系统一致，操作列固定右侧）
    html += `<div class="table-wrapper wr-table-wrapper"><table class="po-table wr-table">`;
    html += `<thead><tr>
        <th>生产订单编号</th>
        <th>产品名称</th>
        <th>工序名称</th>
        <th>报工人员</th>
        <th>完成数量</th>
        <th>不良品数量</th>
        <th>报工时间</th>
        <th>不良品原因</th>
        <th>备注</th>
        <th>创建时间</th>
        <th class="po-fix-right">操作</th>
    </tr></thead>`;
    html += `<tbody id="tableBody">`;
    const rows = window._wrFiltered || config.data;
    rows.forEach((row) => {
        html += `<tr>
            <td class="po-mono">${row.orderNo}</td>
            <td>${row.product}</td>
            <td>${row.processName}</td>
            <td>${row.reporter}</td>
            <td class="po-num">${row.completedQty}</td>
            <td class="po-num">${row.defectQty > 0 ? `<span class="wr-defect">${row.defectQty}</span>` : row.defectQty}</td>
            <td class="po-mono">${row.reportTime}</td>
            <td>${row.defectReason || '-'}</td>
            <td class="wr-remark">${row.remark || '-'}</td>
            <td class="po-mono">${row.createTime}</td>
            <td class="po-actions po-fix-right">
                <button class="btn-text-link" onclick="wrView(${row.id})">查看</button>
                <button class="btn-text-link danger" onclick="wrDelete(${row.id})">删除</button>
            </td>
        </tr>`;
    });
    html += `</tbody></table></div>`;

    html += renderPagination(rows.length);
    return html;
}

// 报工记录：只读查看页（全字段 + 工序参数表，无任何编辑入口）
function wrView(id) {
    const row = getWrById(id);
    if (!row) return;
    const config = PAGE_CONFIG['work-report'];
    currentPage = 'work-report-view';

    const item = (l, v) => `<div class="detail-item"><span class="detail-label">${l}</span><span class="detail-value">${v ?? '-'}</span></div>`;

    let html = '';
    html += `<div class="detail-topbar">
        <button class="back-icon" onclick="navigateTo('work-report','报工记录')" title="返回">‹</button>
        <span class="detail-title">报工记录详情</span>
    </div>`;

    // 报工信息（只读）
    html += `<div class="card">
        <div class="card-header"><span class="card-title">报工信息</span></div>
        <div class="card-body">
            <div class="detail-grid">
                ${item('生产订单编号', row.orderNo)}
                ${item('产品名称', row.product)}
                ${item('工序名称', row.processName)}
                ${item('报工人员', row.reporter)}
                ${item('完成数量', row.completedQty)}
                ${item('不良品数量', row.defectQty)}
                ${item('报工时间', row.reportTime)}
                ${item('不良品原因', row.defectReason || '-')}
                ${item('备注', row.remark || '-')}
                ${item('创建时间', row.createTime)}
            </div>
        </div>
    </div>`;

    // 工序参数（只读表格）
    html += `<div class="card">
        <div class="card-header"><span class="card-title">工序参数</span></div>
        <div class="card-body" style="padding:0;">
            <table class="po-table" style="width:100%;">
                <thead><tr><th>参数名称</th><th>参数类型</th><th>参数值</th></tr></thead>
                <tbody>`;
    if (row.params && row.params.length) {
        row.params.forEach(p => {
            const val = p.type === 'BOOLEAN' ? (p.value === 'true' || p.value === true ? '是' : '否') : `${p.value}${p.unit ? ' ' + p.unit : ''}`;
            html += `<tr><td>${p.name}</td><td>${config.paramTypeMap[p.type] || p.type}</td><td class="po-mono">${val}</td></tr>`;
        });
    } else {
        html += `<tr><td colspan="3" style="text-align:center;color:var(--text-secondary);">暂无工序参数</td></tr>`;
    }
    html += `</tbody></table></div></div>`;

    document.getElementById('pageTitle').textContent = '查看报工记录';
    document.getElementById('content').innerHTML = html;
    document.getElementById('content').scrollTop = 0;
}

// 报工记录：删除（确认弹窗，样式同生产订单）
function wrDelete(id) {
    showDeleteConfirm({
        title: '确认删除吗',
        desc: '删除后不可恢复，是否继续？',
        onConfirm: function() {
            const d = PAGE_CONFIG['work-report'].data;
            const i = d.findIndex(x => x.id === id);
            if (i > -1) d.splice(i, 1);
            showMsg('删除成功', 'success');
            navigateTo('work-report', '报工记录');
        }
    });
}

// ============================================================
// 报工工作台（参照真实系统 WorkReportPlatform：左右分栏）
// 左侧=报工记录列表  右侧=报工参数表单（级联+动态工序参数）
// ============================================================

function renderWorkBench() {
    const config = PAGE_CONFIG['work-bench'];
    const reports = PAGE_CONFIG['work-report'].data;

    let html = '';
    html += `<div class="wb2-container">
        <div class="wb2-header">报工工作台</div>
        <div class="wb2-main">
            <!-- 左侧：报工记录列表 -->
            <div class="wb2-left">
                <div class="wb2-cols">
                    <div class="wb2-col-h">工单编号</div>
                    <div class="wb2-col-h">工序名称</div>
                    <div class="wb2-col-h">生产人员</div>
                    <div class="wb2-col-h">完成数量</div>
                </div>`;
    if (reports.length === 0) {
        html += `<div class="wb2-empty">暂无报工</div>`;
    } else {
        html += `<div class="wb2-list">`;
        reports.forEach(r => {
            html += `<div class="wb2-item">
                <div class="wb2-col">${r.orderNo}</div>
                <div class="wb2-col">${r.processName}</div>
                <div class="wb2-col">${r.reporter}</div>
                <div class="wb2-col wb2-num">${r.completedQty}</div>
            </div>`;
        });
        html += `</div>`;
    }
    html += `</div>
            <!-- 右侧：报工参数表单 -->
            <div class="wb2-right">
                <div class="wb2-form">
                    <div class="wb2-fi">
                        <label class="wb2-label">工单编号 <span class="req-star">*</span></label>
                        <select class="form-input" id="wb-order" onchange="wbOnOrderChange()">
                            <option value="">请选择工单</option>
                            ${config.workOrders.map(o => `<option value="${o.id}">${o.id}</option>`).join('')}
                        </select>
                    </div>
                    <div class="wb2-fi">
                        <label class="wb2-label">工序名称 <span class="req-star">*</span></label>
                        <select class="form-input" id="wb-process" onchange="wbRenderParams()" ${''} disabled>
                            <option value="">请先选择工单</option>
                        </select>
                    </div>
                    <div class="wb2-fi">
                        <label class="wb2-label">生产人员 <span class="req-star">*</span></label>
                        <select class="form-input" id="wb-worker">
                            <option value="">请选择生产人员</option>
                            ${config.workerOptions.map(w => `<option value="${w}">${w}</option>`).join('')}
                        </select>
                    </div>
                    <div class="wb2-fi">
                        <label class="wb2-label">完成数量 <span class="req-star">*</span></label>
                        <input type="number" min="0" step="1" class="form-input" id="wb-good" placeholder="请输入完成数量" />
                    </div>
                    <div class="wb2-fi">
                        <label class="wb2-label">不良品数</label>
                        <input type="number" min="0" step="1" class="form-input" id="wb-defect" placeholder="请输入不良品数" />
                    </div>
                    <div class="wb2-fi">
                        <label class="wb2-label">不良品项</label>
                        <div class="wb2-dd" id="wb-dd-defect">
                            <div class="wb2-dd-box" onclick="wbToggleDefectDd(event)">
                                <div class="wb2-dd-tags" id="wb-dd-tags"><span class="wb2-dd-ph">请选择不良品项</span></div>
                                <span class="wb2-dd-arrow">▾</span>
                            </div>
                        </div>
                    </div>
                    <div class="wb2-fi">
                        <label class="wb2-label">备注</label>
                        <textarea class="form-input" rows="2" id="wb-remark" placeholder="请输入"></textarea>
                    </div>
                    <!-- 工序参数：选工单+工序后动态渲染 -->
                    <div id="wb-params"></div>
                    <div class="wb2-actions">
                        <button class="btn" onclick="wbClearForm()">清空</button>
                        <button class="btn btn-primary wb2-submit" onclick="wbSubmit()">确定</button>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
    return html;
}

// ===== 不良品项：自定义下拉多选（fixed 浮层，选中项蓝色高亮） =====
if (!window._wbDefectTypes) window._wbDefectTypes = [];

function wbToggleDefectDd(e) {
    if (e) e.stopPropagation();
    const existing = document.getElementById('wb-dd-menu');
    if (existing) { wbCloseDefectDd(); return; }
    wbCloseDefectDd();
    const config = PAGE_CONFIG['work-bench'];
    const menu = document.createElement('div');
    menu.id = 'wb-dd-menu';
    menu.className = 'wb2-dd-menu';
    document.body.appendChild(menu);
    wbRenderDefectMenu();
    // fixed 定位：按输入框实时坐标
    const box = document.querySelector('#wb-dd-defect .wb2-dd-box');
    const r = box.getBoundingClientRect();
    const mw = Math.max(200, r.width), mh = menu.offsetHeight;
    let left = Math.min(r.left, window.innerWidth - mw - 8);
    let top = r.bottom + 4;
    if (top + mh > window.innerHeight - 8) top = Math.max(8, r.top - mh - 4);
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
    menu.style.minWidth = mw + 'px';
    menu.classList.add('show');
}

// 渲染下拉选项（选中项蓝色高亮，同参考图）
function wbRenderDefectMenu() {
    const menu = document.getElementById('wb-dd-menu');
    if (!menu) return;
    const config = PAGE_CONFIG['work-bench'];
    menu.innerHTML = config.defectTypeOptions.map(d => {
        const sel = window._wbDefectTypes.includes(d);
        return `<div class="wb2-dd-option${sel ? ' selected' : ''}" onclick="wbPickDefect('${d}')">
            <span class="wb2-dd-check">${sel ? '✓' : ''}</span>${d}
        </div>`;
    }).join('');
}

// 切换选中项（可多选）
function wbPickDefect(d) {
    const i = window._wbDefectTypes.indexOf(d);
    if (i > -1) window._wbDefectTypes.splice(i, 1);
    else window._wbDefectTypes.push(d);
    wbRenderDefectMenu();
    wbUpdateDefectTags();
}

// 回显已选标签
function wbUpdateDefectTags() {
    const box = document.getElementById('wb-dd-tags');
    if (!box) return;
    box.innerHTML = window._wbDefectTypes.length
        ? window._wbDefectTypes.map(d => `<span class="wb2-dd-tag">${d}<span class="wb2-dd-tag-x" onclick="event.stopPropagation();wbPickDefect('${d}')">×</span></span>`).join('')
        : '<span class="wb2-dd-ph">请选择不良品项</span>';
}

function wbCloseDefectDd() {
    const m = document.getElementById('wb-dd-menu');
    if (m) m.remove();
}

// 选工单 → 联动加载该工单的工序
function wbOnOrderChange() {
    const config = PAGE_CONFIG['work-bench'];
    const orderId = document.getElementById('wb-order').value;
    const sel = document.getElementById('wb-process');
    sel.innerHTML = '<option value="">请选择工序</option>';
    if (!orderId) {
        sel.disabled = true;
        sel.innerHTML = '<option value="">请先选择工单</option>';
    } else {
        const wo = config.workOrders.find(o => o.id === orderId);
        (wo ? wo.processes : []).forEach(p => {
            sel.innerHTML += `<option value="${p.name}">${p.name}</option>`;
        });
        sel.disabled = false;
    }
    wbRenderParams();
}

// 选工序 → 动态渲染该工序的参数控件
function wbRenderParams() {
    const config = PAGE_CONFIG['work-bench'];
    const orderId = document.getElementById('wb-order').value;
    const processName = document.getElementById('wb-process').value;
    const box = document.getElementById('wb-params');
    if (!box) return;
    if (!orderId || !processName) { box.innerHTML = ''; return; }
    const wo = config.workOrders.find(o => o.id === orderId);
    const proc = wo && wo.processes.find(p => p.name === processName);
    if (!proc || !proc.params.length) { box.innerHTML = ''; return; }

    let html = `<div class="wb2-param-section">
        <div class="wb2-param-title">工序参数</div>`;
    proc.params.forEach((p, i) => {
        const star = p.required ? ' <span class="req-star">*</span>' : '';
        let ctrl = '';
        if (p.type === 'TEXT') {
            ctrl = `<textarea class="form-input" rows="2" id="wb-param-${i}" placeholder="请输入${p.name}"></textarea>`;
        } else if (p.type === 'NUMERIC') {
            ctrl = `<input type="number" class="form-input" id="wb-param-${i}" placeholder="请输入${p.name}${p.unit ? '(' + p.unit + ')' : ''}" />`;
        } else if (p.type === 'BOOLEAN') {
            ctrl = `<div class="form-switch-wrap"><label class="form-switch"><input type="checkbox" id="wb-param-${i}" /><span class="form-switch-slider"></span></label><span class="form-switch-text">${p.unit || ''}</span></div>`;
        }
        html += `<div class="wb2-fi">
            <label class="wb2-label">${p.name}${star}</label>
            ${ctrl}
            ${p.unit && p.type === 'NUMERIC' ? '' : ''}
            ${p.desc ? `<div class="wb2-param-desc">${p.desc}</div>` : ''}
        </div>`;
    });
    html += `</div>`;
    box.innerHTML = html;
}

// 清空表单（回到初始状态）
function wbClearForm() {
    document.getElementById('wb-order').value = '';
    document.getElementById('wb-process').innerHTML = '<option value="">请先选择工单</option>';
    document.getElementById('wb-process').disabled = true;
    document.getElementById('wb-worker').value = '';
    document.getElementById('wb-good').value = '';
    document.getElementById('wb-defect').value = '';
    document.getElementById('wb-remark').value = '';
    window._wbDefectTypes = [];
    wbCloseDefectDd();
    wbUpdateDefectTags();
    const box = document.getElementById('wb-params');
    if (box) box.innerHTML = '';
}

// 提交报工：校验必填 → 写入报工记录数据源 → 左列表实时刷新
function wbSubmit() {
    const config = PAGE_CONFIG['work-bench'];
    const orderId = document.getElementById('wb-order').value;
    const processName = document.getElementById('wb-process').value;
    const worker = document.getElementById('wb-worker').value;
    const good = document.getElementById('wb-good').value;
    const defect = parseInt(document.getElementById('wb-defect').value || '0', 10);
    const defectTypes = window._wbDefectTypes.slice();
    const remark = document.getElementById('wb-remark').value.trim();

    // 必填校验（与真实系统 rules 一致）
    if (!orderId) { showMsg('请选择工单', 'error'); return; }
    if (!processName) { showMsg('请选择工序', 'error'); return; }
    if (!worker) { showMsg('请选择生产人员', 'error'); return; }
    if (good === '' || isNaN(+good) || +good < 0) { showMsg('请输入完成数量', 'error'); return; }
    if (!isNaN(defect) && defect < 0) { showMsg('不良品数不能为负', 'error'); return; }

    // 工序参数必填校验 + 收集
    const wo = config.workOrders.find(o => o.id === orderId);
    const proc = wo && wo.processes.find(p => p.name === processName);
    const params = [];
    if (proc) {
        for (let i = 0; i < proc.params.length; i++) {
            const p = proc.params[i];
            const el = document.getElementById(`wb-param-${i}`);
            if (!el) continue;
            let val;
            if (p.type === 'BOOLEAN') val = el.checked ? 'true' : 'false';
            else val = el.value.trim();
            if (p.required && (val === '' || (p.type === 'NUMERIC' && isNaN(+val)))) {
                showMsg(`请填写${p.name}`, 'error');
                el.focus();
                return;
            }
            if (val !== '') params.push({ name: p.name, type: p.type, value: val, unit: p.unit || '' });
        }
    }

    // 不良品项 → 不良品原因
    const defectReason = defectTypes.length ? defectTypes.join('、') : '';

    // 组装报工记录（先暂存，弹窗确认后提交）
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const ts = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const wo2 = config.workOrders.find(o => o.id === orderId);
    window._wbPending = {
        id: Math.max(0, ...PAGE_CONFIG['work-report'].data.map(r => r.id)) + 1,
        orderNo: orderId,
        product: wo2 ? wo2.product : '',
        processName: processName,
        reporter: worker,
        completedQty: +good,
        defectQty: defect || 0,
        reportTime: ts,
        defectReason: defectReason,
        remark: remark,
        createTime: ts,
        params: params,
    };
    wbShowConfirm();
}

// 报工信息确认弹窗（表格式展示，确认后提交）
function wbShowConfirm() {
    const r = window._wbPending;
    if (!r) return;
    const config = PAGE_CONFIG['work-report'];
    const row = (l, v) => `<tr><td class="wb2-cf-l">${l}</td><td>${v}</td></tr>`;
    let paramRows = '';
    if (r.params && r.params.length) {
        paramRows = r.params.map(p => {
            const val = p.type === 'BOOLEAN' ? (p.value === 'true' ? '是' : '否') : `${p.value}${p.unit ? ' ' + p.unit : ''}`;
            return row(`${p.name}（${config.paramTypeMap[p.type] || p.type}）`, val);
        }).join('');
    }
    const html = `<div class="modal-overlay" onclick="if(event.target===this)closeModalDirect()">
        <div class="modal wb2-cf-box">
            <div class="modal-header"><span class="modal-title">报工信息</span><span class="modal-close" onclick="closeModalDirect()">×</span></div>
            <div class="modal-body">
                <table class="wb2-cf-table">
                    <tbody>
                        ${row('工单编号', r.orderNo)}
                        ${row('产品名称', r.product)}
                        ${row('工序名称', r.processName)}
                        ${row('生产人员', r.reporter)}
                        ${row('完成数量', r.completedQty)}
                        ${row('不良品数', r.defectQty)}
                        ${row('不良品项', r.defectReason || '-')}
                        ${r.remark ? row('备注', r.remark) : ''}
                        ${paramRows}
                    </tbody>
                </table>
            </div>
            <div class="modal-footer">
                <button class="btn" onclick="closeModalDirect()">取消</button>
                <button class="btn btn-primary" onclick="wbConfirmSubmit()">确认报工</button>
            </div>
        </div>
    </div>`;
    document.getElementById('modalContainer').innerHTML = html;
}

// 确认报工：写入数据源 + 提示成功 + 刷新左侧列表
function wbConfirmSubmit() {
    const r = window._wbPending;
    if (!r) { closeModalDirect(); return; }
    PAGE_CONFIG['work-report'].data.unshift(r);
    window._wbPending = null;
    window._wbDefectTypes = [];
    closeModalDirect();
    showMsg('报工成功', 'success');
    navigateTo('work-bench', '报工工作台');
}

// ============ 表格页面渲染 ============
function renderTablePage(config) {
    let html = '';

    // 产品管理页面特殊处理：带分类侧边栏
    if (config.categorySidebar) {
        return renderProductListPage(config);
    }

    // 搜索栏
    if (config.search && config.search.length > 0) {
        html += `<div class="search-bar">`;
        config.search.forEach(s => {
            html += `<div class="search-item">`;
            html += `<span class="search-label">${s.label}</span>`;
            if (s.type === 'select') {
                // 支持动态数据源：选项来自其他页面数据（如所属分组来自数据分组页）
                let opts = s.options || [];
                if (s.sourcePage) {
                    const src = PAGE_CONFIG[s.sourcePage];
                    if (src && src.data) {
                        const dyn = src.data.map(r => r[s.sourceKey || 'name']).filter(v => v);
                        if (dyn.length) opts = (s.options || []).concat(dyn);
                    }
                }
                html += `<select class="search-select" id="search-${s.name}">`;
                opts.forEach(opt => {
                    html += `<option value="${opt}">${opt}</option>`;
                });
                html += `</select>`;
            } else {
                const isDate = s.type === 'date';
                html += `<input type="${isDate ? 'date' : 'text'}" class="search-input" id="search-${s.name}" placeholder="${s.placeholder || (isDate ? '选择日期' : '请输入')}" onkeydown="if(event.key==='Enter')handleSearch()" />`;
            }
            html += `</div>`;
        });
        // 搜索按钮(如果有searchButtons配置)
        if (config.searchButtons) {
            config.searchButtons.forEach(btn => {
                const cls = btn.type === 'primary' ? 'btn-primary' : btn.type === 'danger' ? 'btn-danger' : '';
                html += `<div class="search-item"><button class="btn ${cls}" onclick="handleButton('${btn.action}', '${config.title}')">${btn.text}</button></div>`;
            });
        } else {
            html += `<div class="search-item"><button class="btn btn-primary" onclick="handleSearch()">查询</button></div>`;
            html += `<div class="search-item"><button class="btn" onclick="handleReset()">重置</button></div>`;
        }
        html += `</div>`;
    }

    // 按钮工具栏
    if (config.buttons && config.buttons.length > 0) {
        html += `<div class="toolbar">`;
        config.buttons.forEach(btn => {
            const cls = btn.type === 'primary' ? 'btn-primary' : btn.type === 'danger' ? 'btn-danger' : btn.type === 'success' ? 'btn-success' : '';
            html += `<button class="btn ${cls}" onclick="handleButton('${btn.action}', '${config.title}')">${btn.text}</button>`;
        });
        html += `</div>`;
    }

    // 表格
    html += `<div class="table-wrapper"><table><thead><tr>`;
    config.columns.forEach(col => {
        html += `<th${col.width ? ` style="min-width:${col.width}px"` : ''}>${col.label}</th>`;
    });
    html += `</tr></thead><tbody id="tableBody">`;

    if (config.data && config.data.length > 0) {
        config.data.forEach((row, idx) => {
            html += `<tr>`;
            config.columns.forEach(col => {
                html += `<td>${renderCell(row, col, idx)}</td>`;
            });
            html += `</tr>`;
        });
    } else {
        const colCount = config.columns.length;
        html += `<tr><td colspan="${colCount}" class="table-empty">暂无数据</td></tr>`;
    }

    html += `</tbody></table>`;

    if (config.data && config.data.length > 0) {
        html += renderPagination(config.data.length);
    }

    html += `</div>`;
    return html;
}

// ============ 产品管理列表页（带分类侧边栏） ============
let selectedCategory = 'all';

function renderProductListPage(config) {
    let html = `<div class="product-layout">`;

    // 左侧分类树
    html += `<div class="category-sidebar">`;
    html += `<div class="category-title"><span class="category-bar"></span>产品分类</div>`;
    html += `<div class="category-tree" id="categoryTree">`;
    PRODUCT_CATEGORIES.forEach(cat => {
        const isActive = selectedCategory === cat.id;
        html += `<div class="cat-node root ${isActive ? 'active' : ''}" onclick="selectCategory('${cat.id}')">`;
        if (cat.children) {
            html += `<span class="cat-arrow expanded" onclick="event.stopPropagation();toggleCategoryExpand(this)">▶</span>`;
        }
        html += `<span class="cat-label">${cat.name}</span>`;
        html += `</div>`;
        if (cat.children) {
            html += `<div class="cat-children expanded">`;
            cat.children.forEach(child => {
                const childActive = selectedCategory === child.id;
                html += `<div class="cat-node child ${childActive ? 'active' : ''}" onclick="selectCategory('${child.id}')">`;
                html += `<span class="cat-label">${child.name}</span>`;
                html += `</div>`;
            });
            html += `</div>`;
        }
    });
    html += `</div>`;
    html += `</div>`;

    // 右侧内容区
    html += `<div class="product-main">`;

    // 工具栏 + 搜索
    html += `<div class="toolbar">`;
    config.buttons.forEach(btn => {
        const cls = btn.type === 'primary' ? 'btn-primary' : btn.type === 'danger' ? 'btn-danger' : '';
        html += `<button class="btn ${cls}" onclick="handleButton('${btn.action}', '${config.title}')">${btn.text}</button>`;
    });
    // 搜索框（右侧）
    if (config.search && config.search.length > 0) {
        const s = config.search[0];
        const savedKeyword = window._productSearchKeyword || '';
        html += `<div class="product-search"><input type="text" class="search-input" placeholder="${s.placeholder}" id="search-keyword" style="min-width:240px;" value="${savedKeyword}" onkeydown="if(event.key==='Enter')handleSearch()" /><button class="btn btn-primary btn-sm" onclick="handleSearch()">🔍</button></div>`;
    }
    html += `</div>`;

    // 表格
    html += `<div class="table-wrapper"><table><thead><tr>`;
    config.columns.forEach(col => {
        html += `<th${col.width ? ` style="min-width:${col.width}px"` : ''}>${col.label}</th>`;
    });
    html += `</tr></thead><tbody id="tableBody">`;

    // 根据分类筛选数据
    let displayData = config.data;
    if (selectedCategory !== 'all') {
        const catMap = { 'finished': '成品', 'semi': '半成品', 'raw': '原材料' };
        const catName = catMap[selectedCategory];
        displayData = config.data.filter(row => row.type === catName);
    }
    // 搜索筛选
    const searchKeyword = (window._productSearchKeyword || '').trim().toLowerCase();
    if (searchKeyword) {
        displayData = displayData.filter(row =>
            (row.code || '').toLowerCase().includes(searchKeyword) ||
            (row.name || '').toLowerCase().includes(searchKeyword)
        );
    }

    if (displayData.length > 0) {
        displayData.forEach((row, idx) => {
            html += `<tr>`;
            config.columns.forEach(col => {
                html += `<td>${renderProductCell(row, col, idx)}</td>`;
            });
            html += `</tr>`;
        });
    } else {
        const colCount = config.columns.length;
        html += `<tr><td colspan="${colCount}" class="table-empty">暂无数据</td></tr>`;
    }

    html += `</tbody></table>`;
    if (displayData.length > 0) {
        html += renderPagination(displayData.length);
    }
    html += `</div>`;

    html += `</div>`; // product-main
    html += `</div>`; // product-layout
    return html;
}

function selectCategory(catId) {
    selectedCategory = catId;
    window._productSearchKeyword = '';
    const config = PAGE_CONFIG['product-list'];
    document.getElementById('content').innerHTML = renderProductListPage(config);
}

function toggleCategoryExpand(el) {
    el.classList.toggle('expanded');
    const parent = el.parentElement;
    const next = parent.nextElementSibling;
    if (next && next.classList.contains('cat-children')) {
        next.classList.toggle('expanded');
    }
}

function renderProductCell(row, col, idx) {
    if (col.key === 'checkbox') {
        return `<input type="checkbox" class="checkbox" />`;
    }
    if (col.key === 'action') {
        return `<button class="btn-text-link danger" onclick="handleDelete(${idx})">删除</button>
                <button class="btn-text-link" onclick="handleProductEdit(${idx})">编辑</button>
                <button class="btn-text-link" onclick="handleProductView(${idx})">查看</button>`;
    }
    let value = row[col.key] !== undefined ? row[col.key] : '';
    if (col.type === 'tag') {
        const tagClass = getTagClass(value);
        return `<span class="tag ${tagClass}">${value}</span>`;
    }
    return value || '-';
}

// ============ 产品详情页 ============
function handleProductView(idx) {
    const config = PAGE_CONFIG['product-list'];
    let data = config.data;
    if (selectedCategory !== 'all') {
        const catMap = { 'finished': '成品', 'semi': '半成品', 'raw': '原材料' };
        const catName = catMap[selectedCategory];
        data = data.filter(row => row.type === catName);
    }
    // 搜索筛选后的索引
    const searchKeyword = (window._productSearchKeyword || '').trim().toLowerCase();
    if (searchKeyword) {
        data = data.filter(row =>
            (row.code || '').toLowerCase().includes(searchKeyword) ||
            (row.name || '').toLowerCase().includes(searchKeyword)
        );
    }
    const row = data[idx];
    if (!row) return;

    const fields = PRODUCT_DETAIL_CONFIG.fields;
    const detailData = {
        code: row.code || '-', name: row.name || '-', category: row.type || '-',
        spec: row.spec || '-', material: row.material || '-',
        weight: row.weight || '0', unit: row.unit || '-', defaultRoute: '来料检+过程检',
        enabled: row.enabled || '-', remark: row.remark || '-',
        appearance: row.appearance || '-', adhesion: row.adhesion || '-',
        rackCode: row.rackCode || '-', rackName: row.rackName || '-',
        thickness: row.thickness || '-', saltSpray: row.saltSpray || '-',
        image: row.image || '-', paint: row.paint || '-',
    };

    let html = `<div class="detail-page">`;
    // 顶部返回图标 + 标题
    html += `<div class="detail-header">`;
    html += `<span class="detail-back-icon" onclick="navigateTo('product-list','产品管理')" title="返回">‹</span>`;
    html += `<span class="detail-header-title">查看产品</span>`;
    html += `</div>`;

    html += `<div class="card"><div class="card-body">`;
    html += `<div class="detail-grid">`;

    for (const [key, label] of Object.entries(fields)) {
        const val = detailData[key] || '-';
        const isStatus = key === 'enabled';
        const displayVal = isStatus
            ? `<span class="tag tag-success">${val}</span>`
            : val;
        html += `<div class="detail-item">`;
        html += `<span class="detail-label">${label}</span>`;
        html += `<span class="detail-value">${displayVal}</span>`;
        html += `</div>`;
    }

    html += `</div>`;
    html += `</div></div>`;

    // 底部按钮
    html += `<div class="detail-footer">`;
    html += `<button class="btn btn-primary" onclick="handleProductEdit(${idx})">编辑</button>`;
    html += `</div>`;
    html += `</div>`;

    document.getElementById('pageTitle').textContent = '查看产品';
    document.getElementById('content').innerHTML = html;
}

// ============ 产品编辑页 ============
function handleProductEdit(idx) {
    const config = PAGE_CONFIG['product-list'];
    let data = config.data;
    if (selectedCategory !== 'all') {
        const catMap = { 'finished': '成品', 'semi': '半成品', 'raw': '原材料' };
        const catName = catMap[selectedCategory];
        data = data.filter(row => row.type === catName);
    }
    // 搜索筛选后的索引
    const searchKeyword = (window._productSearchKeyword || '').trim().toLowerCase();
    if (searchKeyword) {
        data = data.filter(row =>
            (row.code || '').toLowerCase().includes(searchKeyword) ||
            (row.name || '').toLowerCase().includes(searchKeyword)
        );
    }
    const row = data[idx];
    const isEdit = row !== undefined;

    let html = `<div class="detail-page">`;

    // 顶部返回图标 + 标题
    html += `<div class="detail-header">`;
    html += `<span class="detail-back-icon" onclick="navigateTo('product-list','产品管理')" title="返回">‹</span>`;
    html += `<span class="detail-header-title">${isEdit ? '编辑产品' : '新增产品'}</span>`;
    html += `</div>`;

    // 按分组渲染表单
    PRODUCT_DETAIL_CONFIG.editGroups.forEach(group => {
        html += `<div class="card"><div class="card-header"><span class="card-title">${group.title}</span></div><div class="card-body">`;
        html += `<div class="form-grid">`;

        group.fields.forEach(field => {
            const isFull = field.fullWidth;
            const colSpan = isFull ? 'full' : 'half';
            html += `<div class="form-grid-item ${colSpan}">`;
            html += `<label>${field.required ? '<span class="required">*</span>' : ''}${field.label}</label>`;

            const val = isEdit ? getEditValue(row, field) : '';

            if (field.type === 'input' || field.type === 'number') {
                const inputType = field.type === 'number' ? 'number' : 'text';
                html += `<input type="${inputType}" class="form-input" placeholder="请输入" value="${val}" name="${field.name}" ${field.type === 'number' ? 'step="0.01"' : ''} />`;
            } else if (field.type === 'select') {
                html += `<select class="form-select" name="${field.name}">`;
                if (!field.required) html += `<option value="">请选择</option>`;
                field.options.forEach(opt => {
                    html += `<option value="${opt}" ${val === opt ? 'selected' : ''}>${opt}</option>`;
                });
                html += `</select>`;
            } else if (field.type === 'textarea') {
                html += `<textarea class="form-textarea" placeholder="请输入" name="${field.name}">${val}</textarea>`;
            } else if (field.type === 'switch') {
                html += `<label class="switch"><input type="checkbox" ${field.value ? 'checked' : ''} /><span class="slider"></span></label>`;
            } else if (field.type === 'upload') {
                html += `<div class="upload-box"><span class="upload-icon">+</span><span class="upload-text">上传图片</span></div>`;
            }

            html += `</div>`;
        });

        html += `</div>`;
        html += `</div></div>`;
    });

    // 底部按钮
    html += `<div class="detail-footer">`;
    html += `<button class="btn btn-primary" onclick="submitProductEdit()">保存</button>`;
    html += `</div>`;
    html += `</div>`;

    document.getElementById('pageTitle').textContent = isEdit ? '编辑产品' : '新增产品';
    document.getElementById('content').innerHTML = html;
    document.getElementById('content').scrollTop = 0;
}

function getEditValue(row, field) {
    const map = {
        code: row.code, name: row.name, category: row.type,
        spec: row.spec || '', material: row.material || '',
        weight: '0', unit: '', defaultRoute: '来料检+过程检',
        remark: row.remark || '', appearance: '', adhesion: '',
        rackCode: '', rackName: '', thickness: '', saltSpray: '',
        paint: '',
    };
    return map[field.name] || '';
}

function submitProductEdit() {
    alert('保存成功！');
    navigateTo('product-list', '产品管理');
}

function renderCell(row, col, idx) {
    if (col.key === 'checkbox') {
        return `<input type="checkbox" class="checkbox" />`;
    }
    if (col.key === 'action') {
        // 设备报修：按状态动态显示
        if (currentPage === 'equipment-repair') return erActions(row, idx);
        // 任务处理：待执行/进行中→执行，已完成→查看
        if (currentPage === 'maintenance-task') return mtActions(row, idx);
        // 库存单据：入库/出库单（查看/编辑/删除，删除时库存回退）
        if (currentPage === 'inv-in-list' || currentPage === 'inv-out-list') {
            return `<button class="btn-text-link" onclick="siView(${idx})">查看</button>
                    <button class="btn-text-link" onclick="siEditNav(${idx})">编辑</button>
                    <button class="btn-text-link danger" onclick="invDocDelete(${idx})">删除</button>`;
        }
        // 销售出库单（查看/打印/删除，删除时库存回退）
        if (currentPage === 'inv-sales-list') {
            return `<button class="btn-text-link" onclick="soView(${idx})">查看</button>
                    <button class="btn-text-link" onclick="soPrint(${idx})">打印</button>
                    <button class="btn-text-link danger" onclick="invDocDelete(${idx})">删除</button>`;
        }
        // 能耗记录：编辑（独立页）/查看/删除（删除后全量重算）
        if (currentPage === 'energy-record') {
            return `<button class="btn-text-link" onclick="enEditRow(${idx})">编辑</button>
                    <button class="btn-text-link" onclick="enView(${idx})">查看</button>
                    <button class="btn-text-link danger" onclick="enDelete(${idx})">删除</button>`;
        }
        // 数据分组：编辑/删除（分组被引用时禁止删除）
        if (currentPage === 'dc-group') {
            return `<button class="btn-text-link" onclick="handleEdit(${idx})">编辑</button>
                    <button class="btn-text-link danger" onclick="dcGroupDelete(${idx})">删除</button>`;
        }
        // 数据管理：编辑/趋势图/删除
        if (currentPage === 'dc-standard') {
            return `<button class="btn-text-link" onclick="handleEdit(${idx})">编辑</button>
                    <button class="btn-text-link" onclick="dcChartOpen(${idx})">趋势图</button>
                    <button class="btn-text-link danger" onclick="dcStandardDelete(${idx})">删除</button>`;
        }
        // 数据记录：查看/编辑（批量采集页）/删除（删除后联动最新值）
        if (currentPage === 'dc-record') {
            return `<button class="btn-text-link" onclick="dcViewRow(${idx})">查看</button>
                    <button class="btn-text-link" onclick="dcEditRow(${idx})">编辑</button>
                    <button class="btn-text-link danger" onclick="dcRecordDelete(${idx})">删除</button>`;
        }
        // 质检任务4页：查看质检报告
        if (QC_TASK_PAGES.includes(currentPage)) {
            return `<button class="btn-text-link" onclick="qtReport(${idx})">查看</button>`;
        }
        // 产品信息追溯：查看追溯时间轴
        if (currentPage === 'qc-trace') {
            return `<button class="btn-text-link" onclick="qcTraceView(${idx})">查看</button>`;
        }
        // 质检方案：专用编辑器
        if (currentPage === 'qc-plan') {
            return `<button class="btn-text-link" onclick="qpEdit(${idx})">编辑</button>
                    <button class="btn-text-link" onclick="qpView(${idx})">查看</button>
                    <button class="btn-text-link danger" onclick="handleDelete(${idx})">删除</button>`;
        }
        // 工艺路线：专用编辑器
        if (currentPage === 'process-route') {
            return `<button class="btn-text-link" onclick="prEdit(${idx})">编辑</button>
                    <button class="btn-text-link" onclick="prView(${idx})">查看</button>
                    <button class="btn-text-link danger" onclick="handleDelete(${idx})">删除</button>`;
        }
        // 保养计划/点检计划：专用编辑器（含明细+任务生成）
        if (currentPage === 'maintenance-plan' || currentPage === 'inspection-plan') {
            return `<button class="btn-text-link" onclick="mpEdit(currentPage, ${idx})">编辑</button>
                    <button class="btn-text-link" onclick="mpView(currentPage, ${idx})">查看</button>
                    <button class="btn-text-link danger" onclick="handleDelete(${idx})">删除</button>`;
        }
        // 设备/工序/保养项目/点检项目 通用 CRUD 模块
        if (CRUD_PAGES.includes(currentPage)) {
            return `<button class="btn-text-link" onclick="handleEdit(${idx})">编辑</button>
                    <button class="btn-text-link" onclick="commonView(${idx})">查看</button>
                    <button class="btn-text-link danger" onclick="handleDelete(${idx})">删除</button>`;
        }
        return `<button class="btn-text-link" onclick="handleEdit(${idx})">编辑</button>
                <button class="btn-text-link danger" onclick="handleDelete(${idx})">删除</button>`;
    }
    let value = row[col.key] !== undefined ? row[col.key] : '';
    if ((value === '' || value === null || value === undefined) && col.type !== 'progress') value = '-';

    if (col.type === 'tag') {
        if (value === '-') return '<span class="c-cell-muted">-</span>';
        const tagClass = getTagClass(value);
        return `<span class="tag ${tagClass}">${value}</span>`;
    }
    if (col.type === 'progress') {
        const pct = parseFloat(value);
        const cls = pct >= 99 ? 'green' : pct >= 95 ? 'blue' : pct >= 90 ? 'orange' : 'red';
        return `<div style="display:flex;align-items:center;gap:8px;">
            <div class="progress-bar" style="flex:1;"><div class="progress-fill ${cls}" style="width:${pct}%"></div></div>
            <span>${value}%</span>
        </div>`;
    }
    if (col.type === 'photo') {
        // 缺陷照片缩略图（SVG 占位）：单图或图组
        if (!value) return '<span class="c-cell-muted">-</span>';
        const list = Array.isArray(value) ? value : [value];
        return `<div class="qc-photo-cell">${list.map(p => qcPhotoThumb(p.kind, p.label)).join('')}</div>`;
    }
    return value;
}

function getTagClass(value) {
    const map = {
        '生产中': 'tag-info', '执行中': 'tag-info', '运行中': 'tag-success', '检验中': 'tag-info', '已排产': 'tag-info', '维修中': 'tag-info',
        '已完成': 'tag-success', '已合格': 'tag-success', '合格': 'tag-success', '正常': 'tag-success', '成功': 'tag-success', '启用': 'tag-success', '充足': 'tag-success', '已读': 'tag-default',
        '待排产': 'tag-default', '待执行': 'tag-default', '待检验': 'tag-default', '待维修': 'tag-default', '备用': 'tag-default', '未读': 'tag-warning',
        '已取消': 'tag-danger', '已不合格': 'tag-danger', '不合格': 'tag-danger', '紧急': 'tag-danger', '禁用': 'tag-danger',
        '已逾期': 'tag-danger', '已暂停': 'tag-warning',
        '预警': 'tag-warning', '停机': 'tag-warning',
        '系统通知': 'tag-info', '生产提醒': 'tag-warning', '设备告警': 'tag-danger', '质检通知': 'tag-success',
        // 设备管理状态
        '停用': 'tag-warning', '报废': 'tag-danger', '未分配维修人': 'tag-warning', '计划中': 'tag-info', '进行中': 'tag-info',
        '一般': 'tag-default',
        // 保养计划模块状态
        '禁用': 'tag-default', '待执行': 'tag-warning', '保养': 'tag-info', '点检': 'tag-success',
        // 质检模块状态
        '待处理': 'tag-warning', '返工': 'tag-warning', '让步接收': 'tag-warning', '跳过': 'tag-default',
        '来料检': 'tag-info', '过程检': 'tag-info', '综合检': 'tag-info',
    };
    return map[value] || 'tag-default';
}

function renderPagination(total) {
    return `
        <div class="pagination">
            <span class="pagination-info">共 ${total} 条</span>
            <button class="page-btn" disabled>‹</button>
            <button class="page-btn active">1</button>
            <button class="page-btn">2</button>
            <button class="page-btn">3</button>
            <button class="page-btn">›</button>
            <select class="search-select" style="min-width:80px;">
                <option>10条/页</option>
                <option>20条/页</option>
                <option>50条/页</option>
            </select>
        </div>
    `;
}

// ============ 交互处理 ============
function handleSearch() {
    if (currentPage === 'product-list') {
        const input = document.getElementById('search-keyword');
        if (input) {
            window._productSearchKeyword = input.value;
            const config = PAGE_CONFIG['product-list'];
            document.getElementById('content').innerHTML = renderProductListPage(config);
        }
        return;
    }
    // 生产订单：14列自定义表格，需按字段语义筛选后整页重渲染
    if (currentPage === 'production-order') {
        const config = PAGE_CONFIG['production-order'];
        const gv = (id) => { const el = document.getElementById('search-' + id); return el ? el.value.trim().toLowerCase() : ''; };
        const orderNo = gv('orderNo'), product = gv('product'), creator = gv('creator');
        const type = gv('type'), urgent = gv('urgent'), finishStatus = gv('finishStatus');
        const startDate = gv('startDate'), endDate = gv('endDate');
        // 记录原始值用于重渲染后回填
        document._poSearchVal = { orderNo, product, creator, type, urgent, finishStatus, startDate, endDate };
        let filtered = config.data.filter(row => {
            if (orderNo && !String(row.orderNo || '').toLowerCase().includes(orderNo)) return false;
            if (product && !(`${row.productName || ''} ${row.productCode || ''}`).toLowerCase().includes(product)) return false;
            if (creator && !String(row.creator || '').toLowerCase().includes(creator)) return false;
            if (type && type !== '全部' && String(row.type || '') !== type) return false;
            if (urgent && urgent !== '全部' && String(row.urgent || '') !== urgent) return false;
            if (finishStatus && finishStatus !== '全部' && String(row.finishStatus || '') !== finishStatus) return false;
            const created = (row.createTime || '').slice(0, 10);
            if (startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate) && created && created < startDate) return false;
            if (endDate && /^\d{4}-\d{2}-\d{2}$/.test(endDate) && created && created > endDate) return false;
            return true;
        });
        window._poFiltered = filtered;
        document.getElementById('content').innerHTML = renderProductionOrderPage();
        // 重渲染后回填搜索条件（输入框是重新生成的）
        ['orderNo','product','creator','type','urgent','finishStatus','startDate','endDate'].forEach(f => {
            const el = document.getElementById('search-' + f);
            if (el) el.value = document._poSearchVal[f];
        });
        if (filtered.length === 0) showMsg('未找到符合条件的工单', 'error');
        return;
    }
    // 生产任务：13列自定义表格，按字段语义筛选后整页重渲染
    if (currentPage === 'production-task') {
        const config = PAGE_CONFIG['production-task'];
        const gv = (id) => { const el = document.getElementById('search-' + id); return el ? el.value.trim().toLowerCase() : ''; };
        const kw = gv('keyword'), order = gv('order'), product = gv('product'), status = gv('status');
        const startDate = gv('startDate'), endDate = gv('endDate');
        // 反查状态中文 → 英文码
        const statusKey = Object.keys(config.statusMap).find(k => config.statusMap[k] === status);
        let filtered = config.data.filter(row => {
            if (kw && !String(row.processName || '').toLowerCase().includes(kw)) return false;
            if (order && order !== '全部' && String(row.productionOrderSn || '') !== order) return false;
            if (product && product !== '全部' && !(`${row.productName || ''}(${row.productCode || ''})`).toLowerCase().includes(product)) return false;
            if (statusKey && row.status !== statusKey) return false;
            const created = (row.createTime || '').slice(0, 10);
            if (startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate) && created && created < startDate) return false;
            if (endDate && /^\d{4}-\d{2}-\d{2}$/.test(endDate) && created && created > endDate) return false;
            return true;
        });
        window._ptFiltered = filtered;
        const sv = { keyword: kw, order, product, status, startDate, endDate };
        document.getElementById('content').innerHTML = renderProcessTaskPage();
        Object.keys(sv).forEach(f => {
            const el = document.getElementById('search-' + f);
            if (el) el.value = sv[f];
        });
        if (filtered.length === 0) showMsg('未找到符合条件的任务', 'error');
        return;
    }
    // 报工记录：11列自定义表格，按字段语义筛选后整页重渲染
    if (currentPage === 'work-report') {
        const config = PAGE_CONFIG['work-report'];
        const gv = (id) => { const el = document.getElementById('search-' + id); return el ? el.value.trim().toLowerCase() : ''; };
        const kw = gv('processName'), orderNo = gv('orderNo'), product = gv('product'), reporter = gv('reporter');
        const startDate = gv('startDate'), endDate = gv('endDate');
        let filtered = config.data.filter(row => {
            if (kw && !String(row.processName || '').toLowerCase().includes(kw)) return false;
            if (orderNo && orderNo !== '全部' && String(row.orderNo || '') !== orderNo) return false;
            if (product && product !== '全部' && !(`${row.product || ''}`).toLowerCase().includes(product.replace(/\(.*\)/, ''))) return false;
            if (reporter && reporter !== '全部' && String(row.reporter || '') !== reporter) return false;
            const rt = (row.reportTime || '').slice(0, 10);
            if (startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate) && rt && rt < startDate) return false;
            if (endDate && /^\d{4}-\d{2}-\d{2}$/.test(endDate) && rt && rt > endDate) return false;
            return true;
        });
        window._wrFiltered = filtered;
        const sv = { processName: kw, orderNo, product, reporter, startDate, endDate };
        document.getElementById('content').innerHTML = renderWorkReportPage();
        Object.keys(sv).forEach(f => {
            const el = document.getElementById('search-' + f);
            if (el) el.value = sv[f];
        });
        if (filtered.length === 0) showMsg('未找到符合条件的报工记录', 'error');
        return;
    }
    // 库存单据列表：订单号/单号/产品 + 日期范围筛选
    if (currentPage === 'inv-in-list' || currentPage === 'inv-out-list' || currentPage === 'inv-sales-list') {
        const gv = (id) => { const el = document.getElementById('search-' + id); return el ? el.value.trim().toLowerCase() : ''; };
        const config = PAGE_CONFIG[currentPage];
        const isSales = currentPage === 'inv-sales-list';
        const kw = gv('kw'), orderNo = gv('orderNo'), product = gv('product');
        const startDate = gv('startDate'), endDate = gv('endDate');
        let filtered = config.data.filter(row => {
            const snField = String(isSales ? (row.orderNo || '') : (row.sn || '')).toLowerCase();
            const timeField = isSales ? String(row.outboundDate || '') : String(row.createTime || '').slice(0, 10);
            const prodField = isSales ? String(row.productNames || '') : (row.items || []).map(it => it.productName).join('、');
            if (kw && !snField.includes(kw)) return false;
            if (orderNo && !snField.includes(orderNo)) return false;
            if (product && !prodField.toLowerCase().includes(product)) return false;
            if (startDate && timeField && timeField < startDate) return false;
            if (endDate && timeField && timeField > endDate) return false;
            return true;
        });
        window._filteredData = filtered;
        window._genericSearchKeyword = '1';
        renderFilteredTable(config, filtered);
        if (filtered.length === 0) showMsg('未找到符合条件的单据', 'error');
        return;
    }
    // 能耗记录：类型 + 使用日期范围筛选
    if (currentPage === 'energy-record') {
        const gv = (id) => { const el = document.getElementById('search-' + id); return el ? el.value.trim() : ''; };
        const type = gv('type'), startDate = gv('startDate'), endDate = gv('endDate');
        const filtered = PAGE_CONFIG['energy-record'].data.filter(row => {
            if (type && type !== '全部' && row.type !== type) return false;
            if (startDate && row.usageDate < startDate) return false;
            if (endDate && row.usageDate > endDate) return false;
            return true;
        });
        window._filteredData = filtered;
        window._genericSearchKeyword = '1';
        renderFilteredTable(PAGE_CONFIG['energy-record'], filtered);
        if (filtered.length === 0) showMsg('未找到符合条件的能耗记录', 'error');
        return;
    }
    // 数据分组：分组名称关键词筛选
    if (currentPage === 'dc-group') {
        const kwEl = document.getElementById('search-kw');
        const kw = kwEl ? kwEl.value.trim().toLowerCase() : '';
        const filtered = PAGE_CONFIG['dc-group'].data.filter(row => !kw || String(row.name || '').toLowerCase().includes(kw));
        window._filteredData = filtered;
        window._genericSearchKeyword = '1';
        renderFilteredTable(PAGE_CONFIG['dc-group'], filtered);
        if (filtered.length === 0) showMsg('未找到符合条件的分组', 'error');
        return;
    }
    // 数据管理：名称关键词 + 所属分组筛选
    if (currentPage === 'dc-standard') {
        const kwEl = document.getElementById('search-kw');
        const groupEl = document.getElementById('search-group');
        const kw = kwEl ? kwEl.value.trim().toLowerCase() : '';
        const group = groupEl ? groupEl.value : '全部';
        const filtered = PAGE_CONFIG['dc-standard'].data.filter(row => {
            if (kw && !String(row.name || '').toLowerCase().includes(kw)) return false;
            if (group && group !== '全部' && row.groupName !== group) return false;
            return true;
        });
        window._filteredData = filtered;
        window._genericSearchKeyword = '1';
        renderFilteredTable(PAGE_CONFIG['dc-standard'], filtered);
        if (filtered.length === 0) showMsg('未找到符合条件的数据名称', 'error');
        return;
    }
    // 数据记录：采集时间范围筛选
    if (currentPage === 'dc-record') {
        const gv = (id) => { const el = document.getElementById('search-' + id); return el ? el.value.trim() : ''; };
        const startDate = gv('startDate'), endDate = gv('endDate');
        const filtered = PAGE_CONFIG['dc-record'].data.filter(row => {
            const day = (row.collectTime || '').slice(0, 10);
            if (startDate && day && day < startDate) return false;
            if (endDate && day && day > endDate) return false;
            return true;
        });
        window._filteredData = filtered;
        window._genericSearchKeyword = '1';
        renderFilteredTable(PAGE_CONFIG['dc-record'], filtered);
        if (filtered.length === 0) showMsg('未找到符合条件的数据记录', 'error');
        return;
    }
    // 通用搜索: 筛选表格数据
    const config = PAGE_CONFIG[currentPage];
    if (config && config.data && config.search) {
        let filtered = config.data.slice();
        config.search.forEach(s => {
            const el = document.getElementById('search-' + s.name);
            if (!el) return;
            const val = el.value.trim().toLowerCase();
            if (val && val !== '全部') {
                filtered = filtered.filter(row =>
                    String(row[s.name] || '').toLowerCase().includes(val)
                );
            }
        });
        // 保存筛选后的数据供编辑/删除使用
        window._filteredData = filtered;
        window._genericSearchKeyword = '1';
        renderFilteredTable(config, filtered);
        return;
    }
    // 回退: 视觉效果
    const rows = document.querySelectorAll('#tableBody tr');
    rows.forEach(r => r.style.opacity = '0.5');
    setTimeout(() => {
        rows.forEach(r => r.style.opacity = '1');
    }, 300);
}

function renderFilteredTable(config, filteredData) {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    let html = '';
    if (filteredData.length > 0) {
        filteredData.forEach((row, idx) => {
            html += `<tr>`;
            config.columns.forEach(col => {
                html += `<td>${renderCell(row, col, idx)}</td>`;
            });
            html += `</tr>`;
        });
    } else {
        html += `<tr><td colspan="${config.columns.length}" class="table-empty">暂无数据</td></tr>`;
    }
    tbody.innerHTML = html;
}

function handleReset() {
    document.querySelectorAll('.search-input, .search-select').forEach(el => {
        if (el.tagName === 'SELECT') el.selectedIndex = 0;
        else el.value = '';
    });
    window._filteredData = null;
    window._genericSearchKeyword = '';
    window._productSearchKeyword = '';
    window._poFiltered = null;
    document._poSearchVal = null;
    window._ptFiltered = null;
    window._wrFiltered = null;
    navigateTo(currentPage);
}

function handleButton(action, title) {
    if (action === 'add') {
        if (currentPage === 'product-list') {
            handleProductEdit();
            return;
        }
        if (currentPage === 'production-order') {
            poEdit(0);
            return;
        }
        if (currentPage === 'process-route') {
            prEdit();
            return;
        }
        if (currentPage === 'maintenance-plan' || currentPage === 'inspection-plan') {
            mpEdit(currentPage);
            return;
        }
        if (currentPage === 'qc-plan') {
            qpEdit();
            return;
        }
        if (currentPage === 'inv-in-list' || currentPage === 'inv-out-list') {
            siAdd();
            return;
        }
        if (currentPage === 'inv-sales-list') {
            soAdd();
            return;
        }
        // 能耗记录：跳转独立编辑页
        if (currentPage === 'energy-record') {
            enAdd();
            return;
        }
        // 数据记录：跳转批量采集页
        if (currentPage === 'dc-record') {
            dcBatchAdd();
            return;
        }
        if (QC_TASK_PAGES.includes(currentPage)) {
            qtAdd(currentPage); // 跳转独立"质检报告工作台"页面（批量检验/单独检验）
            return;
        }
        const formConfig = FORM_CONFIG[currentPage];
        if (formConfig) {
            showAddModal(formConfig);
        } else {
            alert(`新增${title}功能`);
        }
    } else if (action === 'export') {
        alert(`正在导出${title}数据...`);
    } else if (action === 'refresh') {
        navigateTo(currentPage);
    } else if (action === 'import') {
        alert('请选择要导入的文件');
    } else if (action === 'batchDelete') {
        showBatchDeleteModal();
    } else if (action === 'search') {
        handleSearch();
    } else if (action === 'reset') {
        handleReset();
    } else if (action === 'markRead') {
        alert('已标记为已读');
    }
}

function handleEdit(idx) {
    if (currentPage === 'product-list') {
        handleProductEdit(idx);
        return;
    }
    if (currentPage === 'process-route') {
        prEdit(idx);
        return;
    }
    if (currentPage === 'maintenance-plan' || currentPage === 'inspection-plan') {
        mpEdit(currentPage, idx);
        return;
    }
    if (currentPage === 'qc-plan') {
        qpEdit(idx);
        return;
    }
    if (QC_TASK_PAGES.includes(currentPage)) {
        qtEdit(currentPage, idx);
        return;
    }
    const formConfig = FORM_CONFIG[currentPage];
    if (formConfig) {
        showAddModal(formConfig, idx);
    } else {
        alert('编辑功能');
    }
}

function handleDelete(idx) {
    // 设备/工序模块：真实删除数据行并重渲染
    if (ALL_MODULE_PAGES.includes(currentPage)) {
        showDeleteConfirm({
            desc: '确认删除该条数据吗？删除后不可恢复。',
            onConfirm: function() {
                const config = PAGE_CONFIG[currentPage];
                const row = getEqRow(currentPage, idx);
                const realIdx = config.data.indexOf(row);
                if (realIdx > -1) config.data.splice(realIdx, 1);
                window._filteredData = null;
                showMsg('删除成功');
                rerenderCurrentTable();
            }
        });
        return;
    }
    showDeleteConfirm({
        title: '确认删除吗',
        desc: '确认删除该条数据吗？删除后不可恢复。',
        onConfirm: function() {
            const rows = document.querySelectorAll('#tableBody tr');
            if (rows[idx]) {
                rows[idx].style.opacity = '0';
                setTimeout(() => {
                    if (rows[idx]) rows[idx].remove();
                }, 300);
            }
        }
    });
}

// ============ 弹窗 ============
function showAddModal(formConfig, editIdx) {
    const isEdit = editIdx !== undefined && editIdx !== null;
    const title = isEdit ? `编辑${formConfig.title.replace('新增', '').replace('添加', '')}` : formConfig.title;
    window._editingIdx = isEdit ? editIdx : null;

    // 编辑时获取当前行数据
    let editRow = null;
    if (isEdit) {
        const config = PAGE_CONFIG[currentPage];
        if (config && config.data) {
            // 优先使用搜索筛选后的数据
            if (window._filteredData && window._filteredData.length > 0) {
                editRow = window._filteredData[editIdx];
            }
            if (!editRow) {
                editRow = config.data[editIdx];
            }
        }
    }

    let fieldsHtml = '';
    const fields = formConfig.fields;
    for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        const isFullRow = field.type === 'textarea' || field.type === 'switch' || field.type === 'image';
        const val = editRow ? (editRow[field.name] !== undefined ? editRow[field.name] : '') : '';

        if (isFullRow) {
            fieldsHtml += `<div class="form-row"><div class="form-item" style="width:100%;">`;
            if (field.type === 'textarea') {
                fieldsHtml += `<label>${field.required ? '<span class="required">*</span>' : ''}${field.label}</label>`;
                fieldsHtml += `<textarea class="form-textarea" placeholder="请输入" name="${field.name}">${val}</textarea>`;
            } else if (field.type === 'switch') {
                fieldsHtml += `<label>${field.label}</label>`;
                fieldsHtml += `<label class="switch"><input type="checkbox" ${isEdit ? (val ? 'checked' : '') : (field.value ? 'checked' : '')} /><span class="slider"></span></label>`;
            } else if (field.type === 'image') {
                fieldsHtml += `<label>${field.label}</label>`;
                fieldsHtml += renderFieldWithValue(field, val).replace(/<div class="form-item">|<\/div>$/g, '');
            }
            fieldsHtml += `</div></div>`;
        } else {
            const next = i + 1 < fields.length && !['textarea', 'switch', 'image'].includes(fields[i+1].type) ? fields[i+1] : null;
            fieldsHtml += `<div class="form-row">`;
            fieldsHtml += renderFieldWithValue(field, val);
            if (next) {
                const nextVal = editRow ? (editRow[next.name] !== undefined ? editRow[next.name] : '') : '';
                fieldsHtml += renderFieldWithValue(next, nextVal);
                i++;
            } else {
                fieldsHtml += `<div class="form-item"></div>`;
            }
            fieldsHtml += `</div>`;
        }
    }

    const modalHtml = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <span class="modal-title">${title}</span>
                    <button class="modal-close" onclick="closeModalDirect()">×</button>
                </div>
                <div class="modal-body">
                    ${fieldsHtml}
                </div>
                <div class="modal-footer">
                    <button class="btn" onclick="closeModalDirect()">取消</button>
                    <button class="btn btn-primary" onclick="submitForm('${currentPage}')">确定</button>
                </div>
            </div>
        </div>
    `;
    document.getElementById('modalContainer').innerHTML = modalHtml;
}

function renderFieldWithValue(field, val) {
    let html = `<div class="form-item">`;
    html += `<label>${field.required ? '<span class="required">*</span>' : ''}${field.label}</label>`;
    if (field.type === 'input') {
        html += `<input type="text" class="form-input" placeholder="${field.placeholder || '请输入'}" name="${field.name}" value="${val || ''}" />`;
    } else if (field.type === 'date') {
        html += `<input type="date" class="form-input" name="${field.name}" value="${val || ''}" />`;
    } else if (field.type === 'datetime') {
        const dtVal = val ? String(val).replace(' ', 'T').slice(0, 16) : '';
        html += `<input type="datetime-local" class="form-input" name="${field.name}" value="${dtVal}" />`;
    } else if (field.type === 'image') {
        html += `<div class="eq-img-upload" onclick="eqPickImage(this)">
            <span class="eq-img-plus">＋</span>
            <span class="eq-img-text">上传图片</span>
        </div>`;
    } else if (field.type === 'select') {
        // 支持动态数据源：选项来自其他页面数据（如工序类型下拉来自工序类型页）
        let options = field.options || [];
        if (field.sourcePage) {
            const src = PAGE_CONFIG[field.sourcePage];
            if (src && src.data) {
                const dyn = src.data
                    .filter(r => !field.sourceStatusFilter || r.status === field.sourceStatusFilter)
                    .map(r => r[field.sourceKey || 'name']);
                if (dyn.length) options = dyn;
            }
        }
        html += `<select class="form-select" name="${field.name}">`;
        if (!field.required) html += `<option value="">请选择</option>`;
        options.forEach(opt => {
            html += `<option value="${opt}" ${val === opt ? 'selected' : ''}>${opt}</option>`;
        });
        html += `</select>`;
    }
    html += `</div>`;
    return html;
}

function closeModal(event) {
    if (event.target === event.currentTarget) {
        document.getElementById('modalContainer').innerHTML = '';
    }
}

function closeModalDirect() {
    document.getElementById('modalContainer').innerHTML = '';
}

function submitForm(page) {
    const formConfig = FORM_CONFIG[page];
    // 非模块管理页或无配置：保持原演示行为
    if (!formConfig || !ALL_MODULE_PAGES.includes(page)) {
        closeModalDirect();
        alert('保存成功！');
        return;
    }
    // 收集表单值
    const modal = document.querySelector('#modalContainer .modal');
    if (!modal) return;
    const vals = {};
    modal.querySelectorAll('[name]').forEach(el => {
        vals[el.name] = el.value.trim();
    });
    // 必填校验（高亮 + 聚焦第一个未填控件）
    for (const f of formConfig.fields) {
        if (f.required && !vals[f.name]) {
            const el = modal.querySelector(`[name="${f.name}"]`);
            if (el) {
                el.classList.add('form-control-error');
                el.focus();
            }
            showMsg(`请填写「${f.label}」`, 'error');
            return;
        }
    }
    // datetime-local 值格式化：2026-01-02T08:30 → 2026-01-02 08:30
    formConfig.fields.forEach(f => {
        if (f.type === 'datetime' && vals[f.name]) vals[f.name] = vals[f.name].replace('T', ' ');
        if (f.type === 'image') delete vals[f.name]; // 图片为演示占位，不入库
    });

    const config = PAGE_CONFIG[page];
    const editIdx = window._editingIdx;
    if (editIdx !== null && editIdx !== undefined) {
        // 编辑：更新对应行
        const row = getEqRow(page, editIdx);
        if (row) Object.assign(row, vals);
        showMsg('保存成功');
    } else {
        // 新增：补充默认字段后插入列表顶部
        const newRow = Object.assign({}, vals);
        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        const nowStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:00`;
        if (page === 'equipment-repair') {
            newRow.status = '未分配维修人';
            newRow.assignee = '';
        }
        // 表格含创建时间列的页面，自动填充创建时间
        if (config.columns && config.columns.some(c => c.key === 'createTime')) {
            newRow.createTime = nowStr;
        }
        config.data.unshift(newRow);
        showMsg('新增成功');
    }
    window._editingIdx = null;
    closeModalDirect();
    rerenderCurrentTable();
}

function showChangePassword() {
    const html = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <span class="modal-title">修改密码</span>
                    <button class="modal-close" onclick="closeModalDirect()">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-row"><div class="form-item">
                        <label><span class="required">*</span>原密码</label>
                        <input type="password" class="form-input" placeholder="请输入原密码" />
                    </div></div>
                    <div class="form-row"><div class="form-item">
                        <label><span class="required">*</span>新密码</label>
                        <input type="password" class="form-input" placeholder="请输入新密码" />
                    </div></div>
                    <div class="form-row"><div class="form-item">
                        <label><span class="required">*</span>确认新密码</label>
                        <input type="password" class="form-input" placeholder="请再次输入新密码" />
                    </div></div>
                </div>
                <div class="modal-footer">
                    <button class="btn" onclick="closeModalDirect()">取消</button>
                    <button class="btn btn-primary" onclick="closeModalDirect();alert('密码修改成功！');">确定</button>
                </div>
            </div>
        </div>
    `;
    document.getElementById('modalContainer').innerHTML = html;
}

// ============ 统一删除确认弹窗 ============
let _deleteConfirmCallback = null;

function showDeleteConfirm(options) {
    const { title = '确认删除吗', desc = '确认删除该条数据吗？删除后不可恢复。', confirmText = '确定删除', onConfirm } = options;
    _deleteConfirmCallback = onConfirm;
    const html = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="batch-delete-modal" onclick="event.stopPropagation()">
                <div class="batch-delete-icon">⚠</div>
                <div class="batch-delete-title">${title}</div>
                <div class="batch-delete-desc">${desc}</div>
                <div class="batch-delete-footer">
                    <button class="batch-btn-cancel" onclick="closeModalDirect()" autofocus>取消</button>
                    <button class="batch-btn-confirm" onclick="executeDeleteConfirm()">${confirmText}</button>
                </div>
            </div>
        </div>
    `;
    document.getElementById('modalContainer').innerHTML = html;
    setTimeout(() => {
        const cancelBtn = document.querySelector('.batch-btn-cancel');
        if (cancelBtn) cancelBtn.focus();
    }, 50);
}

function executeDeleteConfirm() {
    if (_deleteConfirmCallback) _deleteConfirmCallback();
    closeModalDirect();
    _deleteConfirmCallback = null;
}

function showBatchDeleteModal() {
    showDeleteConfirm({
        title: '确认批量删除吗',
        desc: '确认删除选中的数据吗？删除后不可恢复。',
        onConfirm: function() {
            const checkboxes = document.querySelectorAll('#tableBody input[type="checkbox"]:checked');
            if (checkboxes.length === 0) {
                alert('请先勾选要删除的数据');
                return;
            }
            checkboxes.forEach(cb => {
                const row = cb.closest('tr');
                if (row) row.remove();
            });
        }
    });
}

// ============================================================
// 设备管理模块：设备列表 / 设备报修 / 维修类型（对齐真实系统）
// ============================================================

// 取当前行数据（兼容搜索筛选后的索引）
function getEqRow(page, idx) {
    const config = PAGE_CONFIG[page];
    if (!config || !config.data) return null;
    if (currentPage === page && window._filteredData && window._filteredData.length) {
        const row = window._filteredData[idx];
        if (row) return row;
    }
    return config.data[idx];
}

// 表格重渲染（清空筛选状态）
function rerenderCurrentTable() {
    navigateTo(currentPage);
}

// 详情值格式化：空值显示 -，数字千分位
function fmtDetailVal(v) {
    if (v === '' || v === null || v === undefined) return '-';
    if (typeof v === 'number') return v.toLocaleString('zh-CN');
    return v;
}

// 通用只读详情弹窗
function showDetailModal(title, config, row) {
    const rows = (config.detailFields || []).map(([k, label]) =>
        `<tr><td class="wb2-cf-l">${label}</td><td>${fmtDetailVal(row[k])}</td></tr>`).join('');
    const html = `<div class="modal-overlay" onclick="if(event.target===this)closeModalDirect()">
        <div class="modal wb2-cf-box eq-detail-box">
            <div class="modal-header"><span class="modal-title">${title}</span><span class="modal-close" onclick="closeModalDirect()">×</span></div>
            <div class="modal-body">
                <table class="wb2-cf-table">
                    <tbody>${rows}</tbody>
                </table>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="closeModalDirect()">关闭</button>
            </div>
        </div>
    </div>`;
    document.getElementById('modalContainer').innerHTML = html;
}

// ===== 设备报修：操作按钮按状态动态显示（与真实系统一致） =====
function erActions(row, idx) {
    const s = row.status;
    let btns = '';
    if (s === '未分配维修人') {
        btns += `<button class="btn-text-link" onclick="erAssign(${idx})">指派</button>`;
    } else if (s === '计划中') {
        btns += `<button class="btn-text-link" onclick="erAssign(${idx})">指派</button>`;
        btns += `<button class="btn-text-link" onclick="erStart(${idx})">开始维修</button>`;
    } else if (s === '进行中') {
        btns += `<button class="btn-text-link" onclick="erComplete(${idx})">完成维修</button>`;
    }
    if (s === '未分配维修人' || s === '计划中' || s === '进行中') {
        btns += `<button class="btn-text-link danger" onclick="erCancel(${idx})">取消</button>`;
    }
    btns += `<button class="btn-text-link" onclick="erView(${idx})">详情</button>`;
    return btns;
}

// 报修详情
function erView(idx) {
    const row = getEqRow('equipment-repair', idx);
    if (!row) return;
    showDetailModal('维修单详情', PAGE_CONFIG['equipment-repair'], row);
}

// 指派维修人弹窗
function erAssign(idx) {
    const row = getEqRow('equipment-repair', idx);
    if (!row) return;
    window._erAssignIdx = idx;
    const html = `<div class="modal-overlay" onclick="if(event.target===this)closeModalDirect()">
        <div class="modal" style="min-width:420px;">
            <div class="modal-header"><span class="modal-title">指派维修人</span><span class="modal-close" onclick="closeModalDirect()">×</span></div>
            <div class="modal-body">
                <div class="form-row"><div class="form-item" style="width:100%;">
                    <label><span class="required">*</span>维修单号</label>
                    <input type="text" class="form-input" value="${row.repairNo}" disabled />
                </div></div>
                <div class="form-row"><div class="form-item" style="width:100%;">
                    <label><span class="required">*</span>维修人</label>
                    <select class="form-select" id="er-assignee">
                        <option value="">请选择</option>
                        <option value="张三">张三</option>
                        <option value="李四">李四</option>
                        <option value="王五">王五</option>
                        <option value="赵六">赵六</option>
                    </select>
                </div></div>
                <div class="form-row"><div class="form-item" style="width:100%;">
                    <label>指派备注</label>
                    <textarea class="form-textarea" id="er-assign-remark" placeholder="请输入指派备注（选填）"></textarea>
                </div></div>
            </div>
            <div class="modal-footer">
                <button class="btn" onclick="closeModalDirect()">取消</button>
                <button class="btn btn-primary" onclick="erSubmitAssign()">确认指派</button>
            </div>
        </div>
    </div>`;
    document.getElementById('modalContainer').innerHTML = html;
}

function erSubmitAssign() {
    const idx = window._erAssignIdx;
    const row = getEqRow('equipment-repair', idx);
    const sel = document.getElementById('er-assignee');
    const assignee = sel ? sel.value : '';
    if (!assignee) {
        sel.classList.add('form-control-error');
        sel.focus();
        showMsg('请选择维修人', 'error');
        return;
    }
    const remark = document.getElementById('er-assign-remark').value.trim();
    if (row) {
        row.assignee = assignee;
        if (row.status === '未分配维修人') row.status = '计划中';
        if (remark) row.remark = remark;
    }
    closeModalDirect();
    showMsg('指派成功');
    rerenderCurrentTable();
}

// 开始维修：直接开始，不弹确认框
function erStart(idx) {
    const row = getEqRow('equipment-repair', idx);
    if (!row) return;
    row.status = '进行中';
    showMsg('已开始维修');
    rerenderCurrentTable();
}

// 完成维修弹窗（填写维修结果）
function erComplete(idx) {
    const row = getEqRow('equipment-repair', idx);
    if (!row) return;
    window._erCompleteIdx = idx;
    const html = `<div class="modal-overlay" onclick="if(event.target===this)closeModalDirect()">
        <div class="modal" style="min-width:420px;">
            <div class="modal-header"><span class="modal-title">完成维修</span><span class="modal-close" onclick="closeModalDirect()">×</span></div>
            <div class="modal-body">
                <div class="form-row"><div class="form-item" style="width:100%;">
                    <label>维修单号</label>
                    <input type="text" class="form-input" value="${row.repairNo}" disabled />
                </div></div>
                <div class="form-row"><div class="form-item" style="width:100%;">
                    <label><span class="required">*</span>维修结果</label>
                    <textarea class="form-textarea" id="er-complete-result" placeholder="请填写维修处理结果"></textarea>
                </div></div>
            </div>
            <div class="modal-footer">
                <button class="btn" onclick="closeModalDirect()">取消</button>
                <button class="btn btn-primary" onclick="erSubmitComplete()">确认完成</button>
            </div>
        </div>
    </div>`;
    document.getElementById('modalContainer').innerHTML = html;
}

function erSubmitComplete() {
    const idx = window._erCompleteIdx;
    const row = getEqRow('equipment-repair', idx);
    const ta = document.getElementById('er-complete-result');
    const result = ta ? ta.value.trim() : '';
    if (!result) {
        ta.classList.remove('form-control-error');
        void ta.offsetWidth; // 重置动画
        ta.classList.add('form-control-error');
        ta.focus();
        showMsg('请填写维修结果', 'error');
        return;
    }
    if (row) {
        row.status = '已完成';
        row.remark = result;
    }
    closeModalDirect();
    showMsg('维修已完成');
    rerenderCurrentTable();
}

// 取消维修单
function erCancel(idx) {
    const row = getEqRow('equipment-repair', idx);
    if (!row) return;
    showDeleteConfirm({
        title: '取消维修单',
        desc: `确认取消维修单「${row.repairNo}」吗？取消后不可恢复。`,
        confirmText: '确认取消',
        onConfirm: function() {
            row.status = '已取消';
            showMsg('维修单已取消');
            rerenderCurrentTable();
        }
    });
}

// ===== 表单图片上传占位（原型演示） =====
function eqPickImage(el) {
    el.innerHTML = `<span class="eq-img-done">✓ 已选择图片 1 张（演示）</span>`;
    el.classList.add('uploaded');
}

// ============================================================
// 工序管理模块：工序列表 / 工艺路线 / 工序类型 / 工艺路线类型 / 不良原因
// ============================================================

// 通用 CRUD 模块页（操作列：编辑/查看/删除）
const CRUD_PAGES = ['equipment-list', 'repair-type', 'work-process', 'work-process-type', 'process-route-type', 'defect-reason', 'maintenance-item', 'inspection-item', 'qc-item'];
// 全部真实增删改模块页（含设备报修、工艺路线、保养/点检计划、任务处理、质检方案、质检任务4页）
const ALL_MODULE_PAGES = CRUD_PAGES.concat(['equipment-repair', 'process-route', 'maintenance-plan', 'inspection-plan', 'maintenance-task', 'qc-plan', 'qc-incoming', 'qc-process', 'qc-finished', 'qc-outgoing', 'qc-trace', 'dc-group', 'dc-standard']);

// 通用查看：按页面 detailFields 只读展示
function commonView(idx) {
    const config = PAGE_CONFIG[currentPage];
    const row = getEqRow(currentPage, idx);
    if (!row || !config) return;
    const name = (config.title || '') + '详情';
    showDetailModal(name, config, row);
}

// 工具：属性值转义（用于拼接 HTML 属性）
function prEsc(v) {
    return String(v === undefined || v === null ? '' : v)
        .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

// 工序列表启用的工序（供工序明细选择）
function prWorkProcessOptions() {
    const src = PAGE_CONFIG['work-process'];
    return src && src.data ? src.data.filter(r => r.status === '启用').map(r => r.name) : [];
}

// 工艺路线类型选项（供分类下拉）
function prRouteTypeOptions() {
    const src = PAGE_CONFIG['process-route-type'];
    return src && src.data ? src.data.map(r => r.typeName) : [];
}

// 当前时间字符串
function nowDateTimeStr() {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:00`;
}

// ===== 工艺路线：新增/编辑大弹窗 =====
function prEdit(idx) {
    const isEdit = idx !== undefined && idx !== null;
    let row = null;
    if (isEdit) {
        row = getEqRow('process-route', idx);
        if (!row) return;
    }
    window._prEditIdx = isEdit ? idx : null;
    window._prSteps = row && row.steps ? JSON.parse(JSON.stringify(row.steps)) : [];

    const rc = PAGE_CONFIG['process-route'];
    const typeOptions = prRouteTypeOptions();
    const title = isEdit ? '编辑工艺路线' : '添加工艺路线';
    const catOpts = typeOptions.map(t =>
        `<option value="${t}" ${row && row.category === t ? 'selected' : ''}>${t}</option>`).join('');

    const html = `<div class="modal-overlay" onclick="if(event.target===this)closeModalDirect()">
        <div class="modal pr-editor-box" onclick="event.stopPropagation()">
            <div class="modal-header"><span class="modal-title">${title}</span><span class="modal-close" onclick="closeModalDirect()">×</span></div>
            <div class="modal-body">
                <div class="pr-section-title">基础信息</div>
                <div class="form-row">
                    <div class="form-item">
                        <label><span class="required">*</span>名称</label>
                        <input type="text" class="form-input" id="pr-name" placeholder="请输入路线名称" value="${prEsc(row && row.name)}" />
                    </div>
                    <div class="form-item">
                        <label><span class="required">*</span>分类</label>
                        <select class="form-select" id="pr-category"><option value="">请选择</option>${catOpts}</select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-item" style="width:100%;">
                        <label>备注</label>
                        <textarea class="form-textarea" id="pr-remark" placeholder="请输入备注">${prEsc(row && row.remark)}</textarea>
                    </div>
                </div>
                <div class="pr-section-title">
                    <span>工序明细（通过上移/下移调整工序先后顺序）</span>
                    <button class="btn btn-primary btn-sm" onclick="prAddStep()">＋ 添加工序</button>
                </div>
                <div class="pr-steps-wrap">
                    <table class="pr-steps-table">
                        <thead>
                            <tr>
                                <th style="width:44px;">序号</th>
                                <th style="width:130px;">工序名称</th>
                                <th style="width:130px;">工艺指导书</th>
                                <th>操作说明</th>
                                <th style="width:120px;">处理方式</th>
                                <th style="width:130px;">质检方案</th>
                                <th style="width:70px;">自动入库</th>
                                <th style="width:170px;">操作</th>
                            </tr>
                        </thead>
                        <tbody id="pr-steps-body"></tbody>
                    </table>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn" onclick="closeModalDirect()">取消</button>
                <button class="btn btn-primary" onclick="prSave()">保存</button>
            </div>
        </div>
    </div>`;
    document.getElementById('modalContainer').innerHTML = html;
    prRenderSteps();
}

// 渲染工序明细行
function prRenderSteps() {
    const rc = PAGE_CONFIG['process-route'];
    const tbody = document.getElementById('pr-steps-body');
    if (!tbody) return;
    if (!window._prSteps || !window._prSteps.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="table-empty">暂无工序，请点击"添加工序"</td></tr>`;
        return;
    }
    const wpOptions = prWorkProcessOptions();
    tbody.innerHTML = window._prSteps.map((s, i) => {
        const isQc = rc.qcHandleTypes.includes(s.handleType);
        const wpOpts = ['<option value="">请选择</option>'].concat(wpOptions.map(n =>
            `<option value="${n}" ${s.name === n ? 'selected' : ''}>${n}</option>`)).join('');
        const htOpts = rc.handleTypeOptions.map(h =>
            `<option value="${h}" ${s.handleType === h ? 'selected' : ''}>${h}</option>`).join('');
        const qcOpts = ['<option value="">请选择</option>'].concat(rc.qcPlanOptions.map(p =>
            `<option value="${p}" ${s.qcPlan === p ? 'selected' : ''}>${p}</option>`)).join('');
        const guideHtml = s.guide && s.guide !== '-'
            ? `<span class="pr-guide has" title="${prEsc(s.guide)}">📄 ${prEsc(s.guide)}</span>`
            : `<span class="pr-guide" onclick="prPickGuide(${i})">＋ 上传</span>`;
        return `<tr>
            <td class="pr-seq">${i + 1}</td>
            <td><select class="pr-input" onchange="prStepChange(${i}, 'name', this.value)">${wpOpts}</select></td>
            <td>${guideHtml}</td>
            <td><input type="text" class="pr-input" placeholder="请输入操作说明" value="${prEsc(s.instruction)}" onchange="prStepChange(${i}, 'instruction', this.value)" /></td>
            <td><select class="pr-input" onchange="prHandleChange(${i}, this.value)">${htOpts}</select></td>
            <td><select class="pr-input" ${isQc ? '' : 'disabled'} onchange="prStepChange(${i}, 'qcPlan', this.value)">${qcOpts}</select></td>
            <td class="pr-switch-cell"><label class="switch"><input type="checkbox" ${s.autoIn ? 'checked' : ''} onchange="prStepChange(${i}, 'autoIn', this.checked)" /><span class="slider"></span></label></td>
            <td class="pr-ops">
                <button class="btn-text-link" onclick="prMove(${i}, -1)" ${i === 0 ? 'disabled' : ''}>上移</button>
                <button class="btn-text-link" onclick="prMove(${i}, 1)" ${i === window._prSteps.length - 1 ? 'disabled' : ''}>下移</button>
                <button class="btn-text-link" onclick="prInsert(${i})">插入</button>
                <button class="btn-text-link danger" onclick="prRemove(${i})">删除</button>
            </td>
        </tr>`;
    }).join('');
}

// 修改步骤字段值
function prStepChange(i, key, val) {
    if (window._prSteps[i]) window._prSteps[i][key] = val;
}

// 处理方式变更：质检类才启用质检方案
function prHandleChange(i, val) {
    const rc = PAGE_CONFIG['process-route'];
    window._prSteps[i].handleType = val;
    const isQc = rc.qcHandleTypes.includes(val);
    const tr = document.querySelectorAll('#pr-steps-body tr')[i];
    if (tr) {
        const qcSel = tr.querySelectorAll('select')[2]; // 0=工序名称 1=处理方式 2=质检方案
        if (qcSel) {
            qcSel.disabled = !isQc;
            if (!isQc) qcSel.value = '';
        }
    }
    if (!isQc) window._prSteps[i].qcPlan = '';
}

// 上传工艺指导书（演示占位）
function prPickGuide(i) {
    if (window._prSteps[i]) window._prSteps[i].guide = `SOP-${Date.now() % 100000}.pdf`;
    prRenderSteps();
}

// 上移/下移
function prMove(i, dir) {
    const steps = window._prSteps;
    const j = i + dir;
    if (j < 0 || j >= steps.length) return;
    // 先同步当前行输入值（输入框 onchange 在按钮点击时可能未触发）
    prSyncRowInputs();
    const tmp = steps[i];
    steps[i] = steps[j];
    steps[j] = tmp;
    prRenderSteps();
}

// 在第 i 行后插入空行
function prInsert(i) {
    prSyncRowInputs();
    window._prSteps.splice(i + 1, 0, { name: '', guide: '', instruction: '', handleType: '普通工序', qcPlan: '', autoIn: false });
    prRenderSteps();
}

// 末尾添加工序
function prAddStep() {
    prSyncRowInputs();
    window._prSteps.push({ name: '', guide: '', instruction: '', handleType: '普通工序', qcPlan: '', autoIn: false });
    prRenderSteps();
    // 滚动到明细底部
    const body = document.querySelector('.pr-editor-box .modal-body');
    if (body) body.scrollTop = body.scrollHeight;
}

// 删除工序行
function prRemove(i) {
    prSyncRowInputs();
    window._prSteps.splice(i, 1);
    prRenderSteps();
}

// 将当前明细行的输入值同步回状态（输入框/下拉未触发 change 时兜底）
function prSyncRowInputs() {
    const rows = document.querySelectorAll('#pr-steps-body tr');
    rows.forEach((tr, i) => {
        const step = window._prSteps[i];
        if (!step) return;
        const selects = tr.querySelectorAll('select');
        const input = tr.querySelector('input.pr-input');
        if (selects[0] && selects[0].value) step.name = selects[0].value;
        if (selects[1]) step.handleType = selects[1].value;
        if (selects[2] && !selects[2].disabled) step.qcPlan = selects[2].value;
        if (input) step.instruction = input.value;
    });
}

// 保存工艺路线
function prSave() {
    const rc = PAGE_CONFIG['process-route'];
    const nameEl = document.getElementById('pr-name');
    const catEl = document.getElementById('pr-category');
    const name = nameEl ? nameEl.value.trim() : '';
    const category = catEl ? catEl.value : '';
    const remark = (document.getElementById('pr-remark') || {}).value || '';
    if (!name) {
        nameEl.classList.add('form-control-error');
        nameEl.focus();
        showMsg('请填写路线名称', 'error');
        return;
    }
    if (!category) {
        catEl.classList.add('form-control-error');
        catEl.focus();
        showMsg('请选择分类', 'error');
        return;
    }
    prSyncRowInputs();
    if (!window._prSteps.length) {
        showMsg('请至少添加一道工序', 'error');
        return;
    }
    for (let i = 0; i < window._prSteps.length; i++) {
        if (!window._prSteps[i].name) {
            showMsg(`第 ${i + 1} 道工序未选择工序名称`, 'error');
            return;
        }
    }
    const data = { name, category, remark: remark.trim(), steps: JSON.parse(JSON.stringify(window._prSteps)) };
    const idx = window._prEditIdx;
    if (idx !== null && idx !== undefined) {
        const row = getEqRow('process-route', idx);
        if (row) Object.assign(row, data);
        showMsg('保存成功');
    } else {
        data.creator = '管理员';
        data.createTime = nowDateTimeStr();
        rc.data.unshift(data);
        showMsg('新增成功');
    }
    window._prEditIdx = null;
    window._prSteps = [];
    closeModalDirect();
    rerenderCurrentTable();
}

// ===== 工艺路线：查看详情 =====
function prView(idx) {
    const row = getEqRow('process-route', idx);
    if (!row) return;
    const rc = PAGE_CONFIG['process-route'];
    const baseRows = [
        ['名称', row.name], ['分类', row.category], ['创建人', row.creator],
        ['创建时间', row.createTime], ['备注', row.remark],
    ].map(([l, v]) => `<tr><td class="wb2-cf-l">${l}</td><td>${fmtDetailVal(v)}</td></tr>`).join('');
    const stepsHtml = (row.steps || []).map((s, i) => {
        const isQc = rc.qcHandleTypes.includes(s.handleType);
        return `<tr>
            <td class="pr-seq">${i + 1}</td>
            <td>${fmtDetailVal(s.name)}</td>
            <td>${fmtDetailVal(s.guide)}</td>
            <td>${fmtDetailVal(s.instruction)}</td>
            <td>${fmtDetailVal(s.handleType)}</td>
            <td>${isQc ? fmtDetailVal(s.qcPlan) : '-'}</td>
            <td>${s.autoIn ? '是' : '否'}</td>
        </tr>`;
    }).join('');
    const html = `<div class="modal-overlay" onclick="if(event.target===this)closeModalDirect()">
        <div class="modal pr-editor-box" onclick="event.stopPropagation()">
            <div class="modal-header"><span class="modal-title">工艺路线详情</span><span class="modal-close" onclick="closeModalDirect()">×</span></div>
            <div class="modal-body">
                <div class="pr-section-title">基础信息</div>
                <table class="wb2-cf-table" style="margin-bottom:16px;">
                    <tbody>${baseRows}</tbody>
                </table>
                <div class="pr-section-title"><span>工序明细</span></div>
                <div class="pr-steps-wrap">
                    <table class="pr-steps-table">
                        <thead>
                            <tr>
                                <th style="width:44px;">序号</th>
                                <th style="width:110px;">工序名称</th>
                                <th style="width:120px;">工艺指导书</th>
                                <th>操作说明</th>
                                <th style="width:100px;">处理方式</th>
                                <th style="width:110px;">质检方案</th>
                                <th style="width:70px;">自动入库</th>
                            </tr>
                        </thead>
                        <tbody>${stepsHtml || `<tr><td colspan="7" class="table-empty">暂无工序</td></tr>`}</tbody>
                    </table>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="closeModalDirect()">关闭</button>
            </div>
        </div>
    </div>`;
    document.getElementById('modalContainer').innerHTML = html;
}

// ============================================================
// 保养计划模块：保养项目 / 保养计划 / 点检项目 / 点检计划 / 任务处理
// ============================================================

// 设备名称选项（来自设备列表）
function mpEquipmentOptions() {
    const src = PAGE_CONFIG['equipment-list'];
    return src && src.data ? src.data.map(r => r.name) : [];
}

// 保养项/点检项选项（来自对应项目页，仅启用的）
function mpItemOptions(itemSourcePage) {
    const src = PAGE_CONFIG[itemSourcePage];
    return src && src.data ? src.data.filter(r => r.status === '启用').map(r => r.name) : [];
}

// ===== 保养计划/点检计划：新增/编辑大弹窗 =====
function mpEdit(page, idx) {
    const isEdit = idx !== undefined && idx !== null;
    let row = null;
    if (isEdit) {
        row = getEqRow(page, idx);
        if (!row) return;
    }
    const config = PAGE_CONFIG[page];
    window._mpEditPage = page;
    window._mpEditIdx = isEdit ? idx : null;
    window._mpRows = row && row.items ? JSON.parse(JSON.stringify(row.items)) : [{ name: '', remark: '' }];

    const kind = config.planKind; // 保养 / 点检
    const itemLabel = config.itemColumnLabel;
    const title = isEdit ? `编辑${config.title}` : `新增${config.title}`;
    const eqOpts = mpEquipmentOptions().map(n =>
        `<option value="${n}" ${row && row.equipment === n ? 'selected' : ''}>${n}</option>`).join('');

    const html = `<div class="modal-overlay" onclick="if(event.target===this)closeModalDirect()">
        <div class="modal pr-editor-box mp-editor-box" onclick="event.stopPropagation()">
            <div class="modal-header"><span class="modal-title">${title}</span><span class="modal-close" onclick="closeModalDirect()">×</span></div>
            <div class="modal-body">
                <div class="pr-section-title">基础信息</div>
                <div class="form-row">
                    <div class="form-item">
                        <label><span class="required">*</span>设备</label>
                        <select class="form-select" id="mp-equipment"><option value="">请选择</option>${eqOpts}</select>
                    </div>
                    <div class="form-item">
                        <label><span class="required">*</span>负责人</label>
                        <input type="text" class="form-input" id="mp-responsible" placeholder="请输入负责人" value="${prEsc(row && row.responsible)}" />
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-item">
                        <label><span class="required">*</span>计划编码</label>
                        <input type="text" class="form-input" id="mp-code" placeholder="如 MP20260101" value="${prEsc(row && row.planCode)}" />
                    </div>
                    <div class="form-item">
                        <label><span class="required">*</span>计划名称</label>
                        <input type="text" class="form-input" id="mp-name" placeholder="请输入计划名称" value="${prEsc(row && row.planName)}" />
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-item">
                        <label>计划开始时间</label>
                        <input type="date" class="form-input" id="mp-start" value="${prEsc(row && row.planStart)}" />
                    </div>
                    <div class="form-item">
                        <label>计划结束时间</label>
                        <input type="date" class="form-input" id="mp-end" value="${prEsc(row && row.planEnd)}" />
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-item">
                        <label>循环周期</label>
                        <div class="mp-cycle">
                            <input type="number" class="form-input" id="mp-cycle" min="1" placeholder="数值" value="${row && row.cycle ? row.cycle : ''}" />
                            <select class="form-select" id="mp-cycle-unit">
                                ${['天','周','月','年'].map(u => `<option value="${u}" ${row && row.cycleUnit === u ? 'selected' : ''}>${u}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="form-item">
                        <label>备注</label>
                        <input type="text" class="form-input" id="mp-remark" placeholder="请输入备注" value="${prEsc(row && row.remark)}" />
                    </div>
                </div>
                <div class="pr-section-title">
                    <span>${itemLabel}明细（保存${config.title}后自动生成${kind}任务）</span>
                </div>
                <div class="pr-steps-wrap">
                    <table class="pr-steps-table">
                        <thead>
                            <tr>
                                <th style="width:44px;">#</th>
                                <th style="width:200px;">${itemLabel}</th>
                                <th>备注描述</th>
                                <th style="width:80px;">操作</th>
                            </tr>
                        </thead>
                        <tbody id="mp-rows-body"></tbody>
                    </table>
                </div>
                <button class="btn btn-dashed mp-add-row" onclick="mpAddRow()">＋ 添加行</button>
            </div>
            <div class="modal-footer">
                <button class="btn" onclick="closeModalDirect()">取消</button>
                <button class="btn btn-primary" onclick="mpSave()">保存</button>
            </div>
        </div>
    </div>`;
    document.getElementById('modalContainer').innerHTML = html;
    mpRenderRows();
}

// 渲染明细行
function mpRenderRows() {
    const page = window._mpEditPage;
    const config = PAGE_CONFIG[page];
    const tbody = document.getElementById('mp-rows-body');
    if (!tbody) return;
    if (!window._mpRows || !window._mpRows.length) {
        tbody.innerHTML = `<tr><td colspan="4" class="table-empty">暂无明细，请点击"添加行"</td></tr>`;
        return;
    }
    const itemOptions = mpItemOptions(config.itemSourcePage);
    tbody.innerHTML = window._mpRows.map((r, i) => {
        const opts = ['<option value="">请选择</option>'].concat(itemOptions.map(n =>
            `<option value="${n}" ${r.name === n ? 'selected' : ''}>${n}</option>`)).join('');
        return `<tr>
            <td class="pr-seq">${i + 1}</td>
            <td><select class="pr-input" onchange="mpRowChange(${i}, 'name', this.value)">${opts}</select></td>
            <td><input type="text" class="pr-input" placeholder="请输入备注描述" value="${prEsc(r.remark)}" onchange="mpRowChange(${i}, 'remark', this.value)" /></td>
            <td><button class="btn-text-link danger" onclick="mpRemoveRow(${i})">删除</button></td>
        </tr>`;
    }).join('');
}

function mpRowChange(i, key, val) {
    if (window._mpRows[i]) window._mpRows[i][key] = val;
}

function mpAddRow() {
    mpSyncRows();
    window._mpRows.push({ name: '', remark: '' });
    mpRenderRows();
}

function mpRemoveRow(i) {
    mpSyncRows();
    window._mpRows.splice(i, 1);
    mpRenderRows();
}

// 输入值兜底同步
function mpSyncRows() {
    document.querySelectorAll('#mp-rows-body tr').forEach((tr, i) => {
        const r = window._mpRows[i];
        if (!r) return;
        const sel = tr.querySelector('select');
        const input = tr.querySelector('input.pr-input');
        if (sel && sel.value) r.name = sel.value;
        if (input) r.remark = input.value;
    });
}

// 保存计划（新增时自动生成任务）
function mpSave() {
    const page = window._mpEditPage;
    const config = PAGE_CONFIG[page];
    const get = id => document.getElementById(id);
    const equipment = get('mp-equipment').value;
    const responsible = get('mp-responsible').value.trim();
    const planCode = get('mp-code').value.trim();
    const planName = get('mp-name').value.trim();

    // 必填校验：高亮第一个未填项
    const checks = [['mp-equipment', equipment, '设备'], ['mp-responsible', responsible, '负责人'], ['mp-code', planCode, '计划编码'], ['mp-name', planName, '计划名称']];
    for (const [id, val, label] of checks) {
        if (!val) {
            const el = get(id);
            el.classList.add('form-control-error');
            el.focus();
            showMsg(`请选择/填写${label}`, 'error');
            return;
        }
    }
    mpSyncRows();
    const items = window._mpRows.filter(r => r.name);
    if (!items.length) {
        showMsg(`请至少添加一行${config.itemColumnLabel}`, 'error');
        return;
    }

    const data = {
        equipment, responsible, planCode, planName,
        planStart: get('mp-start').value,
        planEnd: get('mp-end').value,
        cycle: get('mp-cycle').value ? Number(get('mp-cycle').value) : '',
        cycleUnit: get('mp-cycle-unit').value,
        remark: get('mp-remark').value.trim(),
        items: JSON.parse(JSON.stringify(items)),
    };
    const idx = window._mpEditIdx;
    if (idx !== null && idx !== undefined) {
        const row = getEqRow(page, idx);
        if (row) Object.assign(row, data);
        showMsg('保存成功');
    } else {
        data.status = '计划中';
        data.createTime = nowDateTimeStr();
        config.data.unshift(data);
        // 自动生成任务（新增时）
        mpGenTask(page, data);
        showMsg(`${config.title}保存成功，已自动生成${config.planKind}任务`);
    }
    window._mpEditIdx = null;
    window._mpRows = [];
    closeModalDirect();
    rerenderCurrentTable();
}

// 由计划生成任务（插入任务处理列表顶部）
function mpGenTask(planPage, planRow) {
    const planConfig = PAGE_CONFIG[planPage];
    const taskConfig = PAGE_CONFIG['maintenance-task'];
    const isMt = planConfig.planKind === '保养';
    const prefix = isMt ? 'MT' : 'IT';
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}`;
    const taskNo = `${prefix}${dateStr}${String(Date.now() % 1000).padStart(3, '0')}`;
    const planTime = planRow.planStart ? `${planRow.planStart} 09:00` : '';
    taskConfig.data.unshift({
        taskNo,
        taskName: planRow.planName,
        equipment: planRow.equipment,
        maintType: planConfig.planKind,
        executor: planRow.responsible,
        planTime,
        actualStart: '',
        actualEnd: '',
        status: '待执行',
        createTime: nowDateTimeStr(),
        taskRemark: '',
        items: planRow.items.map(it => ({ name: it.name, result: '', record: '' })),
    });
}

// ===== 计划详情（基础信息+明细） =====
function mpView(page, idx) {
    const row = getEqRow(page, idx);
    if (!row) return;
    const config = PAGE_CONFIG[page];
    const baseRows = [
        ['设备名称', row.equipment], ['负责人', row.responsible], ['计划编码', row.planCode],
        ['计划名称', row.planName], ['计划开始时间', row.planStart], ['计划结束时间', row.planEnd],
        ['循环周期', row.cycle ? `${row.cycle} ${row.cycleUnit || ''}`.trim() : '-'],
        ['状态', row.status], ['备注', row.remark], ['创建时间', row.createTime],
    ].map(([l, v]) => `<tr><td class="wb2-cf-l">${l}</td><td>${fmtDetailVal(v)}</td></tr>`).join('');
    const itemRows = (row.items || []).map((it, i) =>
        `<tr><td class="pr-seq">${i + 1}</td><td>${fmtDetailVal(it.name)}</td><td>${fmtDetailVal(it.remark)}</td></tr>`).join('');
    const html = `<div class="modal-overlay" onclick="if(event.target===this)closeModalDirect()">
        <div class="modal wb2-cf-box eq-detail-box" onclick="event.stopPropagation()">
            <div class="modal-header"><span class="modal-title">${config.title}详情</span><span class="modal-close" onclick="closeModalDirect()">×</span></div>
            <div class="modal-body">
                <div class="pr-section-title">基础信息</div>
                <table class="wb2-cf-table" style="margin-bottom:16px;"><tbody>${baseRows}</tbody></table>
                <div class="pr-section-title"><span>${config.itemColumnLabel}明细</span></div>
                <div class="pr-steps-wrap">
                    <table class="pr-steps-table" style="min-width:420px;">
                        <thead><tr><th style="width:44px;">#</th><th>${config.itemColumnLabel}</th><th>备注描述</th></tr></thead>
                        <tbody>${itemRows || `<tr><td colspan="3" class="table-empty">暂无明细</td></tr>`}</tbody>
                    </table>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="closeModalDirect()">关闭</button>
            </div>
        </div>
    </div>`;
    document.getElementById('modalContainer').innerHTML = html;
}

// ===== 任务处理：操作列按钮 =====
function mtActions(row, idx) {
    if (row.status === '已完成') {
        return `<button class="btn-text-link" onclick="mtView(${idx})">查看</button>`;
    }
    return `<button class="btn-text-link" onclick="mtExec(${idx})">执行</button>`;
}

// ===== 任务执行：进入独立页面 =====
function mtExec(idx) {
    window._mtExecRow = getEqRow('maintenance-task', idx);
    window._mtExecMode = 'exec';
    navigateTo('maintenance-task-exec', '任务执行');
}

// 已完成任务：只读查看（同执行页，控件禁用）
function mtView(idx) {
    window._mtExecRow = getEqRow('maintenance-task', idx);
    window._mtExecMode = 'view';
    navigateTo('maintenance-task-exec', '任务详情');
}

// ===== 任务执行页渲染 =====
function renderTaskExecPage() {
    const row = window._mtExecRow;
    if (!row) return `<div class="card"><div class="card-body"><p>任务不存在</p></div></div>`;
    const isView = window._mtExecMode === 'view' || row.status === '已完成';
    const done = (row.items || []).filter(it => it.result).length;
    const total = (row.items || []).length;

    const infoItem = (label, val) => `<div class="mt-info-item"><span class="mt-info-label">${label}</span><span class="mt-info-value">${fmtDetailVal(val)}</span></div>`;
    const itemRows = (row.items || []).map((it, i) => {
        const resultOpts = ['<option value="">请选择</option>'].concat(['正常','异常','跳过'].map(r =>
            `<option value="${r}" ${it.result === r ? 'selected' : ''}>${r}</option>`)).join('');
        const resultTag = it.result
            ? `<span class="tag ${it.result === '正常' ? 'tag-success' : it.result === '异常' ? 'tag-danger' : 'tag-default'}">${it.result}</span>`
            : '<span class="c-cell-muted">-</span>';
        return `<tr>
            <td class="pr-seq">${i + 1}</td>
            <td>${fmtDetailVal(it.name)}</td>
            <td>${isView ? resultTag : `<select class="pr-input mt-result" data-i="${i}">${resultOpts}</select>`}</td>
            <td>${isView ? fmtDetailVal(it.record) : `<input type="text" class="pr-input mt-record" data-i="${i}" placeholder="请输入检查记录" value="${prEsc(it.record)}" />`}</td>
        </tr>`;
    }).join('');

    return `
        <div class="card mt-exec-card">
            <div class="card-body">
                <div class="mt-exec-top">
                    <div class="mt-exec-title">
                        <span class="tag ${row.status === '已完成' ? 'tag-success' : row.status === '进行中' ? 'tag-info' : 'tag-warning'}">${row.status}</span>
                        <span>${prEsc(row.taskName)}</span>
                        <span class="mt-exec-no">${prEsc(row.taskNo)}</span>
                    </div>
                    <button class="btn" onclick="navigateTo('maintenance-task', '任务处理')">← 返回列表</button>
                </div>
                <div class="mt-info-grid">
                    ${infoItem('任务名称', row.taskName)}
                    ${infoItem('设备', row.equipment)}
                    ${infoItem('维护类型', row.maintType)}
                    ${infoItem('执行人', row.executor)}
                    ${infoItem('计划执行时间', row.planTime)}
                    ${infoItem('实际开始时间', row.actualStart)}
                    ${infoItem('实际完成时间', row.actualEnd)}
                    ${infoItem('进度', total ? `${done}/${total}` : '-')}
                </div>
            </div>
        </div>
        <div class="card mt-exec-card">
            <div class="card-body">
                <div class="pr-section-title">检查项目</div>
                <div class="pr-steps-wrap">
                    <table class="pr-steps-table" style="min-width:640px;">
                        <thead>
                            <tr>
                                <th style="width:44px;">序号</th>
                                <th style="width:180px;">项目名称</th>
                                <th style="width:120px;">检查结果</th>
                                <th>检查记录</th>
                            </tr>
                        </thead>
                        <tbody>${itemRows || `<tr><td colspan="4" class="table-empty">暂无检查项目</td></tr>`}</tbody>
                    </table>
                </div>
            </div>
        </div>
        <div class="card mt-exec-card">
            <div class="card-body">
                <div class="pr-section-title">任务备注</div>
                ${isView
                    ? `<div class="mt-remark-view">${fmtDetailVal(row.taskRemark)}</div>`
                    : `<textarea class="form-textarea" id="mt-remark" placeholder="请输入任务备注">${prEsc(row.taskRemark)}</textarea>`}
            </div>
        </div>
        ${isView ? '' : `
        <div class="mt-exec-footer">
            <button class="btn" onclick="navigateTo('maintenance-task', '任务处理')">返回</button>
            <button class="btn btn-primary" onclick="mtSave()">保存</button>
        </div>`}
    `;
}

// ===== 任务执行：保存 =====
function mtSave() {
    const row = window._mtExecRow;
    if (!row) return;

    // 收集检查项目结果与记录
    const unfinished = [];
    document.querySelectorAll('.mt-result').forEach(sel => {
        const i = Number(sel.dataset.i);
        if (row.items[i]) row.items[i].result = sel.value;
        if (!sel.value) unfinished.push(i + 1);
    });
    document.querySelectorAll('.mt-record').forEach(input => {
        const i = Number(input.dataset.i);
        if (row.items[i]) row.items[i].record = input.value.trim();
    });
    const remarkEl = document.getElementById('mt-remark');
    if (remarkEl) row.taskRemark = remarkEl.value.trim();

    const now = nowDateTimeStr();
    if (row.status === '待执行') {
        row.status = '进行中';
        row.actualStart = now;
        showMsg('任务已开始执行（进行中），全部项目填写检查结果后保存即完成');
    } else if (row.status === '进行中') {
        if (unfinished.length) {
            showMsg(`第 ${unfinished.join('、')} 项未选择检查结果，任务保持进行中`, 'error');
        } else {
            row.status = '已完成';
            row.actualEnd = now;
            showMsg('任务已完成');
        }
    }
    navigateTo('maintenance-task', '任务处理');
}

// ============================================================
// 质检模块：检验项目 / 质检方案 / 质检任务4页 / 追溯 / 统计
// ============================================================

const QC_TASK_PAGES = ['qc-incoming', 'qc-process', 'qc-finished', 'qc-outgoing'];

// ===== 缺陷照片缩略图（SVG 占位，按类型绘制示意） =====
function qcPhotoThumb(kind, label) {
    const bg = { scratch: '#f56a6a', color: '#e6a23c', particle: '#b37feb', rust: '#d48806', thick: '#597ef7', leak: '#13c2c2', package: '#73d13d', check: '#1890ff' }[kind] || '#909399';
    const icon = { scratch: '╱', color: '◐', particle: '⁙', rust: '⬤', thick: '▤', leak: '💧', package: '📦', check: '🔍' }[kind] || '🖼';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="54">
        <defs><linearGradient id="g${kind}" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="${bg}" stop-opacity="0.28"/><stop offset="1" stop-color="${bg}" stop-opacity="0.08"/>
        </linearGradient></defs>
        <rect width="72" height="54" rx="4" fill="url(#g${kind})" stroke="${bg}" stroke-opacity="0.5"/>
        <text x="36" y="26" font-size="16" text-anchor="middle" fill="${bg}">${icon}</text>
        <text x="36" y="42" font-size="8" text-anchor="middle" fill="${bg}">${label || ''}</text>
    </svg>`;
    const uri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    return `<span class="qc-thumb" title="${prEsc(label || '')}"><img src="${uri}" alt="${prEsc(label || '')}" /></span>`;
}

// ===== 质检方案：检验项目选项（来自检验项目页） =====
function qpItemOptions() {
    const src = PAGE_CONFIG['qc-item'];
    return src && src.data ? src.data.map(r => r.name) : [];
}

// ===== 质检方案：新增/编辑大弹窗 =====
function qpEdit(idx) {
    const isEdit = idx !== undefined && idx !== null;
    let row = null;
    if (isEdit) {
        row = getEqRow('qc-plan', idx);
        if (!row) return;
    }
    const config = PAGE_CONFIG['qc-plan'];
    window._qpEditIdx = isEdit ? idx : null;
    window._qpRows = row && row.items ? JSON.parse(JSON.stringify(row.items)) : [{ item: '', refVal: '', minVal: '', maxVal: '', required: true, method: '', standard: '' }];

    const typeOpts = config.inspectTypeOptions.map(t =>
        `<option value="${t}" ${row && row.inspectType === t ? 'selected' : ''}>${t}</option>`).join('');
    const html = `<div class="modal-overlay" onclick="if(event.target===this)closeModalDirect()">
        <div class="modal pr-editor-box" onclick="event.stopPropagation()">
            <div class="modal-header"><span class="modal-title">${isEdit ? '编辑质检方案' : '新增质检方案'}</span><span class="modal-close" onclick="closeModalDirect()">×</span></div>
            <div class="modal-body">
                <div class="pr-section-title">基础信息</div>
                <div class="form-row">
                    <div class="form-item">
                        <label><span class="required">*</span>方案名称</label>
                        <input type="text" class="form-input" id="qp-name" placeholder="请输入方案名称" value="${prEsc(row && row.planName)}" />
                    </div>
                    <div class="form-item">
                        <label><span class="required">*</span>检验类型</label>
                        <select class="form-select" id="qp-type"><option value="">请选择</option>${typeOpts}</select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-item" style="width:100%;">
                        <label>备注</label>
                        <input type="text" class="form-input" id="qp-remark" placeholder="请输入备注" value="${prEsc(row && row.remark)}" />
                    </div>
                </div>
                <div class="pr-section-title">
                    <span>检验项目明细（检验项目选项来自"检验项目"页）</span>
                    <button class="btn btn-primary btn-sm" onclick="qpAddRow()">＋ 添加行</button>
                </div>
                <div class="pr-steps-wrap">
                    <table class="pr-steps-table">
                        <thead>
                            <tr>
                                <th style="width:44px;">#</th>
                                <th style="width:110px;">检验项目</th>
                                <th style="width:100px;">参考值</th>
                                <th style="width:80px;">下限值</th>
                                <th style="width:80px;">上限值</th>
                                <th style="width:64px;">必检</th>
                                <th style="width:150px;">检验方法</th>
                                <th>检验标准</th>
                                <th style="width:56px;">操作</th>
                            </tr>
                        </thead>
                        <tbody id="qp-rows-body"></tbody>
                    </table>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn" onclick="closeModalDirect()">取消</button>
                <button class="btn btn-primary" onclick="qpSave()">保存</button>
            </div>
        </div>
    </div>`;
    document.getElementById('modalContainer').innerHTML = html;
    qpRenderRows();
}

function qpRenderRows() {
    const tbody = document.getElementById('qp-rows-body');
    if (!tbody) return;
    if (!window._qpRows || !window._qpRows.length) {
        tbody.innerHTML = `<tr><td colspan="9" class="table-empty">暂无明细，请点击"添加行"</td></tr>`;
        return;
    }
    const itemOptions = qpItemOptions();
    tbody.innerHTML = window._qpRows.map((r, i) => {
        const opts = ['<option value="">请选择</option>'].concat(itemOptions.map(n =>
            `<option value="${n}" ${r.item === n ? 'selected' : ''}>${n}</option>`)).join('');
        return `<tr>
            <td class="pr-seq">${i + 1}</td>
            <td><select class="pr-input" onchange="qpRowChange(${i}, 'item', this.value);qpSyncItem(${i})">${opts}</select></td>
            <td><input type="text" class="pr-input" placeholder="参考值" value="${prEsc(r.refVal)}" onchange="qpRowChange(${i}, 'refVal', this.value)" /></td>
            <td><input type="text" class="pr-input" placeholder="下限" value="${prEsc(r.minVal)}" onchange="qpRowChange(${i}, 'minVal', this.value)" /></td>
            <td><input type="text" class="pr-input" placeholder="上限" value="${prEsc(r.maxVal)}" onchange="qpRowChange(${i}, 'maxVal', this.value)" /></td>
            <td class="pr-switch-cell"><label class="switch"><input type="checkbox" ${r.required ? 'checked' : ''} onchange="qpRowChange(${i}, 'required', this.checked)" /><span class="slider"></span></label></td>
            <td><input type="text" class="pr-input" placeholder="检验方法" value="${prEsc(r.method)}" onchange="qpRowChange(${i}, 'method', this.value)" /></td>
            <td><input type="text" class="pr-input" placeholder="检验标准" value="${prEsc(r.standard)}" onchange="qpRowChange(${i}, 'standard', this.value)" /></td>
            <td><button class="btn-text-link danger" onclick="qpRemoveRow(${i})">删除</button></td>
        </tr>`;
    }).join('');
}

function qpRowChange(i, key, val) {
    if (window._qpRows[i]) window._qpRows[i][key] = val;
}

// 选中检验项目后自动带出该项目的检验方法/标准（在检验项目页中维护）
function qpSyncItem(i) {
    const row = window._qpRows[i];
    if (!row || !row.item) return;
    const src = PAGE_CONFIG['qc-item'].data.find(d => d.name === row.item);
    if (src) {
        row.method = src.method || row.method;
        row.standard = src.standard || row.standard;
        qpRenderRows();
    }
}

function qpAddRow() {
    qpSyncRows();
    window._qpRows.push({ item: '', refVal: '', minVal: '', maxVal: '', required: true, method: '', standard: '' });
    qpRenderRows();
}

function qpRemoveRow(i) {
    qpSyncRows();
    window._qpRows.splice(i, 1);
    qpRenderRows();
}

function qpSyncRows() {
    document.querySelectorAll('#qp-rows-body tr').forEach((tr, i) => {
        const r = window._qpRows[i];
        if (!r) return;
        const sel = tr.querySelector('select');
        const inputs = tr.querySelectorAll('input.pr-input');
        const sw = tr.querySelector('input[type="checkbox"]');
        if (sel && sel.value) r.item = sel.value;
        if (inputs[0]) r.refVal = inputs[0].value;
        if (inputs[1]) r.minVal = inputs[1].value;
        if (inputs[2]) r.maxVal = inputs[2].value;
        if (inputs[3]) r.method = inputs[3].value;
        if (inputs[4]) r.standard = inputs[4].value;
        if (sw) r.required = sw.checked;
    });
}

function qpSave() {
    const config = PAGE_CONFIG['qc-plan'];
    const get = id => document.getElementById(id);
    const planName = get('qp-name').value.trim();
    const inspectType = get('qp-type').value;
    if (!planName) { get('qp-name').classList.add('form-control-error'); get('qp-name').focus(); showMsg('请填写方案名称', 'error'); return; }
    if (!inspectType) { get('qp-type').classList.add('form-control-error'); get('qp-type').focus(); showMsg('请选择检验类型', 'error'); return; }
    qpSyncRows();
    const items = window._qpRows.filter(r => r.item);
    if (!items.length) { showMsg('请至少添加一行检验项目', 'error'); return; }
    const data = { planName, inspectType, remark: get('qp-remark').value.trim(), items: JSON.parse(JSON.stringify(items)) };
    const idx = window._qpEditIdx;
    if (idx !== null && idx !== undefined) {
        const row = getEqRow('qc-plan', idx);
        if (row) Object.assign(row, data);
        showMsg('保存成功');
    } else {
        data.createTime = nowDateTimeStr();
        config.data.unshift(data);
        showMsg('新增成功');
    }
    window._qpEditIdx = null;
    window._qpRows = [];
    closeModalDirect();
    rerenderCurrentTable();
}

// ===== 质检方案：查看 =====
function qpView(idx) {
    const row = getEqRow('qc-plan', idx);
    if (!row) return;
    const baseRows = [
        ['方案名称', row.planName], ['检验类型', row.inspectType], ['备注', row.remark], ['创建时间', row.createTime],
    ].map(([l, v]) => `<tr><td class="wb2-cf-l">${l}</td><td>${fmtDetailVal(v)}</td></tr>`).join('');
    const itemRows = (row.items || []).map((it, i) => `<tr>
        <td class="pr-seq">${i + 1}</td>
        <td>${fmtDetailVal(it.item)}</td>
        <td>${fmtDetailVal(it.refVal)}</td>
        <td>${fmtDetailVal(it.minVal)}</td>
        <td>${fmtDetailVal(it.maxVal)}</td>
        <td>${it.required ? '<span class="tag tag-danger">必检</span>' : '<span class="tag tag-default">选检</span>'}</td>
        <td>${fmtDetailVal(it.method)}</td>
        <td>${fmtDetailVal(it.standard)}</td>
    </tr>`).join('');
    const html = `<div class="modal-overlay" onclick="if(event.target===this)closeModalDirect()">
        <div class="modal pr-editor-box" onclick="event.stopPropagation()">
            <div class="modal-header"><span class="modal-title">质检方案详情</span><span class="modal-close" onclick="closeModalDirect()">×</span></div>
            <div class="modal-body">
                <div class="pr-section-title">基础信息</div>
                <table class="wb2-cf-table" style="margin-bottom:16px;"><tbody>${baseRows}</tbody></table>
                <div class="pr-section-title"><span>检验项目明细</span></div>
                <div class="pr-steps-wrap">
                    <table class="pr-steps-table" style="min-width:760px;">
                        <thead><tr>
                            <th style="width:44px;">#</th><th>检验项目</th><th>参考值</th><th>下限值</th><th>上限值</th><th>必检</th><th>检验方法</th><th>检验标准</th>
                        </tr></thead>
                        <tbody>${itemRows || `<tr><td colspan="8" class="table-empty">暂无明细</td></tr>`}</tbody>
                    </table>
                </div>
            </div>
            <div class="modal-footer"><button class="btn btn-primary" onclick="closeModalDirect()">关闭</button></div>
        </div>
    </div>`;
    document.getElementById('modalContainer').innerHTML = html;
}

// ===== 质检任务：添加/编辑（真实系统字段 + 工单联动） =====
function qtEdit(page, idx) {
    const isEdit = idx !== undefined && idx !== null;
    let row = null;
    if (isEdit) {
        row = getEqRow(page, idx);
        if (!row) return;
    }
    const config = PAGE_CONFIG[page];
    window._qtEditPage = page;
    window._qtEditIdx = isEdit ? idx : null;
    const poConfig = PAGE_CONFIG['production-order'];
    const orders = poConfig && poConfig.data ? poConfig.data : [];

    const orderOpts = ['<option value="">请选择</option>'].concat(orders.map(o =>
        `<option value="${o.orderNo}" ${row && row.orderNo === o.orderNo ? 'selected' : ''}>${o.orderNo}（${o.productName}）</option>`)).join('');
    const processOpts = ['<option value="">请先选择工单</option>'].join('');
    const inspectorOpts = ['<option value="">请选择</option>'].concat(['赵六','李四','王五','张三'].map(n =>
        `<option value="${n}" ${row && row.inspector === n ? 'selected' : ''}>${n}</option>`)).join('');
    const typeOpts = ['来料检','过程检','成品入库检','出货检'].map(t =>
        `<option value="${t}" ${(row ? row.taskType : config.qcTaskType) === t ? 'selected' : ''}>${t}</option>`).join('');

    const html = `<div class="modal-overlay" onclick="if(event.target===this)closeModalDirect()">
        <div class="modal qt-editor-box" onclick="event.stopPropagation()">
            <div class="modal-header"><span class="modal-title">${isEdit ? '编辑' : '添加'}${config.title}</span><span class="modal-close" onclick="closeModalDirect()">×</span></div>
            <div class="modal-body">
                <div class="pr-section-title">检验信息（选择工单后自动带出产品与客户）</div>
                <div class="form-row">
                    <div class="form-item">
                        <label><span class="required">*</span>工单编号</label>
                        <select class="form-select" id="qt-order" onchange="qtOrderChange(this)">${orderOpts}</select>
                    </div>
                    <div class="form-item">
                        <label><span class="required">*</span>工序名称</label>
                        <select class="form-select" id="qt-process">${processOpts}</select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-item">
                        <label><span class="required">*</span>质检人员</label>
                        <select class="form-select" id="qt-inspector">${inspectorOpts}</select>
                    </div>
                    <div class="form-item">
                        <label><span class="required">*</span>检验时间</label>
                        <input type="datetime-local" class="form-input" id="qt-time" value="${row ? (row.inspectTime || '').replace(' ', 'T').slice(0,16) : ''}" />
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-item">
                        <label><span class="required">*</span>检验类型</label>
                        <select class="form-select" id="qt-type">${typeOpts}</select>
                    </div>
                    <div class="form-item">
                        <label><span class="required">*</span>检验总数量</label>
                        <input type="number" class="form-input" id="qt-actual" min="0" placeholder="请输入实检数量" value="${row ? row.actualQty : ''}" />
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-item">
                        <label><span class="required">*</span>合格总数量</label>
                        <input type="number" class="form-input" id="qt-pass" min="0" placeholder="请输入合格数量" value="${row ? row.passQty : ''}" oninput="qtRate()" />
                    </div>
                    <div class="form-item">
                        <label>合格率（自动计算）</label>
                        <input type="text" class="form-input" id="qt-rate" value="${row ? row.passRate + '%' : '-'}" readonly style="background:#f5f7fa;" />
                    </div>
                </div>
                <div class="form-row"><div class="form-item" style="width:100%;">
                    <label>备注</label>
                    <textarea class="form-textarea" id="qt-remark" placeholder="请输入备注">${prEsc(row && row.remark)}</textarea>
                </div></div>
                <div class="form-row"><div class="form-item" style="width:100%;">
                    <label>过程图片（jpg/png，单张≤2MB，最多9张）</label>
                    <div class="qt-upload-row">
                        <div class="eq-img-upload" onclick="qtPickPhoto(this)">＋ 上传图片</div>
                    </div>
                </div></div>
            </div>
            <div class="modal-footer">
                <button class="btn" onclick="closeModalDirect()">取消</button>
                <button class="btn btn-primary" onclick="qtSave()">保存</button>
            </div>
        </div>
    </div>`;
    document.getElementById('modalContainer').innerHTML = html;
    window._qtPhotos = row && row.photos ? JSON.parse(JSON.stringify(row.photos)) : [];
    // 编辑时初始化工序下拉
    if (row) {
        qtInitProcess(row.orderNo, row.processName);
        qtRenderPhotos();
    }
}

// 初始化工序下拉（按工单节点）
function qtInitProcess(orderNo, selected) {
    const sel = document.getElementById('qt-process');
    if (!sel) return;
    const poConfig = PAGE_CONFIG['production-order'];
    const order = poConfig && poConfig.data ? poConfig.data.find(o => o.orderNo === orderNo) : null;
    const nodes = order && order.nodes ? order.nodes.map(n => n.name) : [];
    sel.innerHTML = ['<option value="">请选择</option>'].concat(nodes.map(n =>
        `<option value="${n}" ${selected === n ? 'selected' : ''}>${n}</option>`)).join('');
}

// 工单切换：带出产品/客户信息并重建工序下拉
function qtOrderChange(el) {
    const orderNo = el.value;
    qtInitProcess(orderNo, '');
    const poConfig = PAGE_CONFIG['production-order'];
    const order = poConfig && poConfig.data ? poConfig.data.find(o => o.orderNo === orderNo) : null;
    if (order) {
        const actualEl = document.getElementById('qt-actual');
        if (actualEl && !actualEl.value) actualEl.value = order.quantity;
    }
}

// 合格率自动计算
function qtRate() {
    const actual = Number(document.getElementById('qt-actual').value) || 0;
    const pass = Number(document.getElementById('qt-pass').value) || 0;
    const rateEl = document.getElementById('qt-rate');
    rateEl.value = actual > 0 ? ((pass / actual) * 100).toFixed(1) + '%' : '-';
}

// 过程图片（演示占位，最多9张）
function qtPickPhoto(el) {
    if (window._qtPhotos.length >= 9) { showMsg('最多上传9张图片', 'error'); return; }
    window._qtPhotos.push({ kind: 'check', label: `现场照片${window._qtPhotos.length + 1}` });
    qtRenderPhotos();
}

function qtRenderPhotos() {
    const box = document.querySelector('.qt-upload-row');
    if (!box) return;
    box.innerHTML = `<div class="eq-img-upload" onclick="qtPickPhoto(this)">＋ 上传图片</div>` +
        window._qtPhotos.map((p, i) => `<span class="qt-photo-item">${qcPhotoThumb(p.kind, p.label)}<span class="qt-photo-x" onclick="qtRemovePhoto(${i})">×</span></span>`).join('');
}

function qtRemovePhoto(i) {
    window._qtPhotos.splice(i, 1);
    qtRenderPhotos();
}

// 保存质检任务
function qtSave() {
    const page = window._qtEditPage;
    const config = PAGE_CONFIG[page];
    const get = id => document.getElementById(id);
    const orderNo = get('qt-order').value;
    const processName = get('qt-process').value;
    const inspector = get('qt-inspector').value;
    const inspectTime = get('qt-time').value;
    const taskType = get('qt-type').value;
    const actualQty = Number(get('qt-actual').value) || 0;
    const passQty = Number(get('qt-pass').value) || 0;

    const checks = [['qt-order', orderNo, '工单编号'], ['qt-process', processName, '工序名称'], ['qt-inspector', inspector, '质检人员'], ['qt-time', inspectTime, '检验时间'], ['qt-actual', get('qt-actual').value, '检验总数量'], ['qt-pass', get('qt-pass').value, '合格总数量']];
    for (const [id, val, label] of checks) {
        if (!val) {
            const el = get(id);
            el.classList.add('form-control-error');
            el.focus();
            showMsg(`请选择/填写${label}`, 'error');
            return;
        }
    }
    if (passQty > actualQty) {
        get('qt-pass').classList.add('form-control-error');
        showMsg('合格数量不能大于实检数量', 'error');
        return;
    }

    // 从生产订单带出产品与客户信息
    const poConfig = PAGE_CONFIG['production-order'];
    const order = poConfig.data.find(o => o.orderNo === orderNo) || {};
    const remark = get('qt-remark').value.trim();
    const passRate = actualQty > 0 ? Number(((passQty / actualQty) * 100).toFixed(1)) : 0;
    const data = {
        orderNo, processName, inspector, taskType, remark,
        inspectTime: inspectTime.replace('T', ' '), actualQty, passQty, passRate,
        productCode: order.productCode || '', productName: order.productName || '',
        customerOrderNo: order.customerOrderNo || '', customerName: order.customer ? order.customer : (order.customerName || ''),
        deliveryDate: order.deliveryDate || '', taskQty: order.quantity || actualQty,
        photos: JSON.parse(JSON.stringify(window._qtPhotos)),
    };
    const idx = window._qtEditIdx;
    if (idx !== null && idx !== undefined) {
        const row = getEqRow(page, idx);
        if (row) Object.assign(row, data);
        showMsg('保存成功');
    } else {
        data.taskType = taskType || config.qcTaskType;
        data.conclusion = passRate >= 95 ? '合格' : '不合格';
        data.createTime = nowDateTimeStr();
        data.reportNo = 'QR-' + String(Date.now()).slice(-6);
        data.items = [];
        config.data.unshift(data);
        showMsg('添加成功，点击"查看"可查看质检报告');
    }
    window._qtEditIdx = null;
    window._qtPhotos = [];
    closeModalDirect();
    rerenderCurrentTable();
}

// ============================================================
// 质检报告工作台（独立页面：添加质检任务）
// 检验类型二选一：批量检验（整批汇总）/ 单独检验（逐件录入）
// 入口：质检任务4页（来料检/过程检/成品入库检/出货检）的"添加"按钮
// ============================================================

// 客户单号 → 客户名（生产订单数据无客户字段时的反查映射）
const QT_PO_CUSTOMERS = {
    'PO-2026-0001': '杭州湾汽配', 'PO-2026-0002': '鼎结数智', 'PO-2026-0003': '赛亦信息',
    'PO-2026-0004': '黑狐智造', 'PO-2026-0005': '宁波汽配', 'PO-2026-0006': '吉利汽车',
};

function qtFindOrder(orderNo) {
    const po = PAGE_CONFIG['production-order'];
    return po && po.data ? po.data.find(o => o.orderNo === orderNo) : null;
}

// 客户名称反查：订单 → 既有质检任务数据 → 客户单号映射
function qtCustomerName(order) {
    if (!order) return '';
    if (order.customer) return order.customer;
    if (order.customerName) return order.customerName;
    if (order.customerOrderNo && QT_PO_CUSTOMERS[order.customerOrderNo]) return QT_PO_CUSTOMERS[order.customerOrderNo];
    let found = null;
    QC_TASK_PAGES.forEach(p => {
        const c = PAGE_CONFIG[p];
        if (found || !c || !c.data) return;
        found = c.data.find(r => r.customerOrderNo === order.customerOrderNo && r.customerName) || null;
    });
    return found ? found.customerName : '';
}

// 工序下拉选项：已选工单取其工艺节点，未选时给通用工序
function qtProcessOptions(order) {
    if (order && order.nodes && order.nodes.length) return order.nodes.map(n => n.name);
    return ['来料检验', '上挂', '打磨检', '电泳', '喷粉', '下挂', '成品入库检', '出货检验'];
}

// 下拉选项拼接（placeholder 传 null 表示不允许空值）
function qtOpts(list, selected, placeholder) {
    const head = placeholder === null ? [] : [`<option value="">${placeholder || '请选择'}</option>`];
    return head.concat((list || []).map(v => `<option value="${v}" ${v === selected ? 'selected' : ''}>${v}</option>`)).join('');
}

// 单独检验：检验项目选项（来自"检验项目"页，兜底通用项目）
function qtItemOptions() {
    const list = qpItemOptions();
    return list.length ? list : ['外观缺陷', '膜厚', '附着力', '尺寸', '外观色差', '光泽度', '耐盐雾性', '硬度'];
}

// 缺陷照片示意类型（按缺陷类型映射）
function qtDefPhotoKind(type) {
    return { '外观不合格': 'scratch', '性能不合格': 'particle', '尺寸不合格': 'thick', '包装不合格': 'package', '材质不合格': 'rust' }[type] || 'check';
}
// 检验照片示意类型（按检验项目映射）
function qtItemPhotoKind(item) {
    return { '膜厚': 'thick', '外观色差': 'color', '外观缺陷': 'scratch', '附着力': 'check', '耐盐雾性': 'check', '光泽度': 'check', '尺寸': 'thick', '硬度': 'check' }[item] || 'check';
}

// ===== 入口：添加质检任务 → 跳转独立工作台页面 =====
function qtAdd(page) {
    const config = PAGE_CONFIG[page] || PAGE_CONFIG['qc-incoming'];
    const n = new Date(); const p = x => String(x).padStart(2, '0');
    window._qtPhotos = [];
    window._qtForm = {
        from: page,
        mode: 'batch', // 检验类型：batch=批量检验 / single=单独检验
        orderNo: '', processName: '', inspector: '',
        inspectTime: `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}T${p(n.getHours())}:${p(n.getMinutes())}`,
        totalQty: '', passQty: '', defectCodes: '', remark: '',
        // 批量检验：缺陷记录明细
        defectRows: [{ type: '', level: '一般', reason: '', handle: '', qty: '', photo: null }],
        // 单独检验：逐件明细（预置两行示例，便于演示合格/不合格颜色效果）
        singleRows: [
            { sn: '', item: '膜厚', result: '合格', level: '', reason: '', handle: '', photo: null },
            { sn: '', item: '外观缺陷', result: '不合格', level: '一般', reason: '漆膜颗粒杂质', handle: '返工返修', photo: null },
        ],
    };
    navigateTo('qc-report-edit', `添加${config.title}`);
}

// ===== 返回列表 =====
function qtBack() {
    const f = window._qtForm;
    const from = f && f.from ? f.from : 'qc-incoming';
    window._qtForm = null;
    window._qtPhotos = [];
    navigateTo(from, PAGE_CONFIG[from].title);
}

// ===== 检验类型切换（批量检验 / 单独检验） =====
function qtSwitchMode(mode) {
    const f = window._qtForm;
    if (!f || f.mode === mode) return;
    qtSyncDraft();
    f.mode = mode;
    navigateTo('qc-report-edit', window._lastPageLabel);
    showMsg(mode === 'batch' ? '已切换为批量检验：整批汇总录入' : '已切换为单独检验：逐件录入检验结果');
}

// ===== 草稿快照（切换类型/工单时保留已填内容） =====
function qtSyncDraft() {
    const f = window._qtForm;
    if (!f) return;
    const grab = (id, key) => { const el = document.getElementById(id); if (el) f[key] = el.value; };
    grab('qt-order', 'orderNo'); grab('qt-process', 'processName');
    grab('qt-inspector', 'inspector'); grab('qt-time', 'inspectTime');
    grab('qt-total', 'totalQty'); grab('qt-pass', 'passQty');
    grab('qt-codes', 'defectCodes'); grab('qt-remark', 'remark');
    qtDefSyncRows();
    qtSingleSyncRows();
}

// ===== 工单切换：带出产品/客户信息、重建工序下拉 =====
function qtOrderChangePage(el) {
    const f = window._qtForm;
    if (!f) return;
    f.orderNo = el.value;
    const order = f.orderNo ? qtFindOrder(f.orderNo) : null;
    // 重建工序下拉（按工单工艺节点）
    const procSel = document.getElementById('qt-process');
    if (procSel) {
        const opts = qtProcessOptions(order);
        procSel.innerHTML = qtOpts(opts, '');
        const prefer = { 'qc-incoming': '来料检验', 'qc-outgoing': '出货检验', 'qc-finished': '成品入库检' }[f.from];
        if (prefer && opts.indexOf(prefer) > -1) { procSel.value = prefer; f.processName = prefer; }
        else f.processName = '';
    }
    // 自动带出信息条
    const autoBox = document.getElementById('qceAutoBox');
    if (autoBox) autoBox.innerHTML = qtAutoInfoHtml(order);
    // 批量检验：未填总数时带出工单数量
    const totalEl = document.getElementById('qt-total');
    if (totalEl && !totalEl.value && order && order.quantity) {
        totalEl.value = order.quantity;
        f.totalQty = String(order.quantity);
    }
    qtCalcRefresh();
}

// ===== 工单关联信息（自动带出，带颜色提示） =====
function qtAutoInfoHtml(order) {
    const items = [
        ['📦', '产品编码', order ? (order.productCode || '-') : '-', 'code'],
        ['🧾', '产品名称', order ? (order.productName || '-') : '-', 'name'],
        ['👤', '客户名称', order ? (qtCustomerName(order) || '-') : '-', 'customer'],
        ['#️⃣', '客户单号', order ? (order.customerOrderNo || '-') : '-', 'po'],
        ['📅', '交付日期', order ? (order.deliveryDate || '-') : '-', 'date'],
        ['🔢', '任务数量', order ? fmtDetailVal(order.quantity) : '-', 'qty'],
    ];
    return `<div class="qce-auto-strip">` + items.map(([ico, k, v, cls]) => `
        <div class="qce-auto-item ${v === '-' ? 'empty' : ''}">
            <span class="qce-auto-k">${ico} ${k}</span>
            <span class="qce-auto-v ${cls}" title="${prEsc(String(v))}">${prEsc(String(v))}</span>
        </div>`).join('') + `</div>`;
}

// ===== 批量检验：缺陷记录明细 =====
function qtDefRowsHtml() {
    const f = window._qtForm;
    const cfg = PAGE_CONFIG['qc-report-edit'];
    const levelCls = { '一般': '', '严重': 'qce-level-serious', '致命': 'qce-level-fatal' };
    const rows = (f.defectRows || []).map((r, i) => `<tr>
        <td class="pr-seq">${i + 1}</td>
        <td><select class="pr-input" onchange="qtDefChange(${i},'type',this.value)">${qtOpts(cfg.defectTypeOptions, r.type)}</select></td>
        <td><select class="pr-input ${levelCls[r.level] || ''}" onchange="qtDefChange(${i},'level',this.value);qtDefRefresh()">${qtOpts(cfg.defectLevelOptions, r.level)}</select></td>
        <td><input type="number" class="pr-input" min="0" placeholder="件数" value="${r.qty}" onchange="qtDefChange(${i},'qty',this.value)" /></td>
        <td><select class="pr-input" onchange="qtDefChange(${i},'reason',this.value)">${qtOpts(cfg.defectReasonOptions, r.reason)}</select></td>
        <td><select class="pr-input" onchange="qtDefChange(${i},'handle',this.value)">${qtOpts(cfg.handleOptions, r.handle)}</select></td>
        <td>${r.photo
            ? `<span class="qt-photo-item">${qcPhotoThumb(r.photo.kind, r.photo.label)}<span class="qt-photo-x" onclick="qtDefPhotoDel(${i})">×</span></span>`
            : `<button type="button" class="pr-guide" onclick="qtDefPhotoAdd(${i})">＋ 缺陷照片</button>`}</td>
        <td><button class="btn-text-link danger" onclick="qtDefDelRow(${i})">删除</button></td>
    </tr>`).join('');
    return rows || `<tr><td colspan="8" class="table-empty">暂无缺陷记录，如本批全部合格可不添加</td></tr>`;
}

function qtDefRefresh() {
    const tbody = document.getElementById('qceDefBody');
    if (tbody) tbody.innerHTML = qtDefRowsHtml();
}

function qtDefChange(i, key, val) {
    const f = window._qtForm;
    if (f && f.defectRows && f.defectRows[i]) f.defectRows[i][key] = val;
}

function qtDefSyncRows() {
    const f = window._qtForm;
    if (!f || !f.defectRows) return;
    document.querySelectorAll('#qceDefBody tr').forEach((tr, i) => {
        const r = f.defectRows[i];
        if (!r) return;
        const selects = tr.querySelectorAll('select');
        const inputs = tr.querySelectorAll('input');
        if (selects[0]) r.type = selects[0].value;
        if (selects[1]) r.level = selects[1].value;
        if (selects[2]) r.reason = selects[2].value;
        if (selects[3]) r.handle = selects[3].value;
        if (inputs[0]) r.qty = inputs[0].value;
    });
}

function qtDefAddRow() {
    const f = window._qtForm;
    if (!f) return;
    qtDefSyncRows();
    f.defectRows.push({ type: '', level: '一般', reason: '', handle: '', qty: '', photo: null });
    qtDefRefresh();
}

function qtDefDelRow(i) {
    const f = window._qtForm;
    if (!f) return;
    qtDefSyncRows();
    f.defectRows.splice(i, 1);
    qtDefRefresh();
}

function qtDefPhotoAdd(i) {
    const f = window._qtForm;
    const r = f && f.defectRows[i];
    if (!r) return;
    r.photo = { kind: qtDefPhotoKind(r.type), label: (r.type || '缺陷') + '照片' };
    qtDefRefresh();
}

function qtDefPhotoDel(i) {
    const f = window._qtForm;
    const r = f && f.defectRows[i];
    if (!r) return;
    r.photo = null;
    qtDefRefresh();
}

// ===== 单独检验：逐件明细 =====
function qtSingleRowsHtml() {
    const f = window._qtForm;
    const cfg = PAGE_CONFIG['qc-report-edit'];
    const items = qtItemOptions();
    const levelCls = { '一般': '', '严重': 'qce-level-serious', '致命': 'qce-level-fatal' };
    const rows = (f.singleRows || []).map((r, i) => {
        const bad = r.result !== '合格';
        return `<tr class="${bad ? 'qce-row-bad' : ''}">
            <td class="pr-seq">${i + 1}</td>
            <td><input type="text" class="pr-input" placeholder="扫码/输入唯一码" value="${prEsc(r.sn)}" onchange="qtSingleChange(${i},'sn',this.value)" /></td>
            <td><select class="pr-input" onchange="qtSingleChange(${i},'item',this.value)">${qtOpts(items, r.item)}</select></td>
            <td><select class="pr-input ${bad ? 'qce-result-bad' : 'qce-result-ok'}" onchange="qtSingleChange(${i},'result',this.value);qtSingleRefresh();qtCalcRefresh()">${qtOpts(['合格', '不合格'], r.result, null)}</select></td>
            <td><select class="pr-input ${levelCls[r.level] || ''}" ${bad ? '' : 'disabled'} onchange="qtSingleChange(${i},'level',this.value)">${qtOpts(cfg.defectLevelOptions, bad ? r.level : '')}</select></td>
            <td><select class="pr-input" ${bad ? '' : 'disabled'} onchange="qtSingleChange(${i},'reason',this.value)">${qtOpts(cfg.defectReasonOptions, bad ? r.reason : '')}</select></td>
            <td><select class="pr-input" ${bad ? '' : 'disabled'} onchange="qtSingleChange(${i},'handle',this.value)">${qtOpts(cfg.handleOptions, bad ? r.handle : '')}</select></td>
            <td>${r.photo
                ? `<span class="qt-photo-item">${qcPhotoThumb(r.photo.kind, r.photo.label)}<span class="qt-photo-x" onclick="qtSinglePhotoDel(${i})">×</span></span>`
                : `<button type="button" class="pr-guide" onclick="qtSinglePhotoAdd(${i})">＋ 检验照片</button>`}</td>
            <td><button class="btn-text-link danger" onclick="qtSingleDelRow(${i})">删除</button></td>
        </tr>`;
    }).join('');
    return rows || `<tr><td colspan="9" class="table-empty">暂无检验明细，请点击"添加检验件"</td></tr>`;
}

function qtSingleTipHtml() {
    const f = window._qtForm;
    const rows = (f.singleRows || []).filter(r => r.sn || r.item);
    const bad = rows.filter(r => r.result !== '合格').length;
    const ok = rows.length - bad;
    return `已录入 <b>${rows.length}</b> 件：合格 <span class="qce-tip-ok">${ok}</span> 件、不合格 <span class="qce-tip-bad">${bad}</span> 件；检验产品总数与合格率自动统计，判定为"不合格"的行（红色底色）需填写缺陷信息。`;
}

function qtSingleRefresh() {
    const tbody = document.getElementById('qceSingleBody');
    if (tbody) tbody.innerHTML = qtSingleRowsHtml();
    const tip = document.getElementById('qceSingleTip');
    if (tip) tip.innerHTML = qtSingleTipHtml();
}

function qtSingleChange(i, key, val) {
    const f = window._qtForm;
    if (!f || !f.singleRows || !f.singleRows[i]) return;
    f.singleRows[i][key] = val;
    if (key === 'result' && val === '合格') {
        // 转为合格时清空缺陷字段
        const r = f.singleRows[i];
        r.level = ''; r.reason = ''; r.handle = '';
    }
}

function qtSingleSyncRows() {
    const f = window._qtForm;
    if (!f || !f.singleRows) return;
    document.querySelectorAll('#qceSingleBody tr').forEach((tr, i) => {
        const r = f.singleRows[i];
        if (!r) return;
        const selects = tr.querySelectorAll('select');
        const inputs = tr.querySelectorAll('input');
        if (inputs[0]) r.sn = inputs[0].value;
        if (selects[0]) r.item = selects[0].value;
        if (selects[1]) r.result = selects[1].value;
        if (selects[2] && !selects[2].disabled) r.level = selects[2].value;
        if (selects[3] && !selects[3].disabled) r.reason = selects[3].value;
        if (selects[4] && !selects[4].disabled) r.handle = selects[4].value;
    });
}

function qtSingleAddRow() {
    const f = window._qtForm;
    if (!f) return;
    qtSingleSyncRows();
    f.singleRows.push({ sn: '', item: '', result: '合格', level: '', reason: '', handle: '', photo: null });
    qtSingleRefresh();
    qtCalcRefresh();
}

function qtSingleDelRow(i) {
    const f = window._qtForm;
    if (!f) return;
    qtSingleSyncRows();
    f.singleRows.splice(i, 1);
    qtSingleRefresh();
    qtCalcRefresh();
}

function qtSingleAllPass() {
    const f = window._qtForm;
    if (!f) return;
    qtSingleSyncRows();
    f.singleRows.forEach(r => { r.result = '合格'; r.level = ''; r.reason = ''; r.handle = ''; });
    qtSingleRefresh();
    qtCalcRefresh();
    showMsg('已将全部检验件标记为合格');
}

function qtSinglePhotoAdd(i) {
    const f = window._qtForm;
    const r = f && f.singleRows[i];
    if (!r) return;
    r.photo = { kind: qtItemPhotoKind(r.item), label: (r.item || '检验') + '照片' };
    qtSingleRefresh();
}

function qtSinglePhotoDel(i) {
    const f = window._qtForm;
    const r = f && f.singleRows[i];
    if (!r) return;
    r.photo = null;
    qtSingleRefresh();
}

// ===== 过程图片（与弹窗版共用 window._qtPhotos） =====
function qtPhotosHtml() {
    return `<div class="eq-img-upload" onclick="qtPickPhoto(this)"><span class="eq-img-plus">＋</span><span class="eq-img-text">上传图片</span></div>` +
        (window._qtPhotos || []).map((p, i) =>
            `<span class="qt-photo-item">${qcPhotoThumb(p.kind, p.label)}<span class="qt-photo-x" onclick="qtRemovePhoto(${i})">×</span></span>`).join('');
}

// ===== 实时统计：检验总数/合格/异常/合格率/综合判定 =====
function qtCalcRefresh() {
    const f = window._qtForm;
    if (!f) return;
    const isBatch = f.mode !== 'single';
    const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    let total = null, pass = null;

    if (isBatch) {
        const tEl = document.getElementById('qt-total');
        const pEl = document.getElementById('qt-pass');
        const dEl = document.getElementById('qt-defect');
        const rEl = document.getElementById('qt-rate');
        if (!tEl || !pEl) return;
        pEl.classList.remove('form-control-error');
        total = tEl.value === '' ? null : Number(tEl.value);
        pass = pEl.value === '' ? null : Number(pEl.value);
        if (total !== null && pass !== null && pass <= total) {
            const defect = Math.max(total - pass, 0);
            const rate = total > 0 ? ((pass / total) * 100).toFixed(1) : '0.0';
            if (dEl) { dEl.value = defect; dEl.classList.toggle('qce-input-bad', defect > 0); }
            if (rEl) {
                rEl.value = rate + '%';
                rEl.classList.remove('qce-rate-ok', 'qce-rate-warn', 'qce-rate-bad');
                rEl.classList.add(Number(rate) >= 95 ? 'qce-rate-ok' : Number(rate) >= 90 ? 'qce-rate-warn' : 'qce-rate-bad');
            }
        } else {
            if (total !== null && pass !== null && pass > total) pEl.classList.add('form-control-error');
            if (dEl) { dEl.value = '-'; dEl.classList.remove('qce-input-bad'); }
            if (rEl) { rEl.value = '-'; rEl.classList.remove('qce-rate-ok', 'qce-rate-warn', 'qce-rate-bad'); }
        }
    } else {
        qtSingleSyncRows();
        const rows = (f.singleRows || []).filter(r => r.sn || r.item);
        total = rows.length;
        pass = rows.filter(r => r.result === '合格').length;
    }

    setTxt('qceTotal', total === null ? '-' : total);
    setTxt('qcePass', pass === null ? '-' : pass);
    const defect = (total !== null && pass !== null) ? Math.max(total - pass, 0) : null;
    setTxt('qceDefect', defect === null ? '-' : defect);

    const rateEl = document.getElementById('qceRate');
    if (rateEl) {
        if (total > 0 && pass !== null && pass <= total) {
            const rate = ((pass / total) * 100).toFixed(1);
            rateEl.textContent = rate + '%';
            rateEl.className = 'qce-live-num ' + (rate >= 95 ? 'ok' : rate >= 90 ? 'warn' : 'bad');
        } else {
            rateEl.textContent = '-';
            rateEl.className = 'qce-live-num';
        }
    }
    const vEl = document.getElementById('qceVerdict');
    if (vEl) {
        if (total > 0 && pass !== null && pass <= total) {
            const ok = pass / total >= 0.95;
            vEl.textContent = ok ? '合格' : '不合格';
            vEl.className = 'qce-verdict-tag ' + (ok ? 'pass' : 'fail');
        } else {
            vEl.textContent = '待检';
            vEl.className = 'qce-verdict-tag wait';
        }
    }
}

// ===== 工作台页面渲染 =====
function renderQcReportEditPage() {
    const f = window._qtForm;
    if (!f) return `<div class="card"><div class="card-body"><p>页面已失效，请从质检任务列表点击"添加"重新进入</p></div></div>`;
    const config = PAGE_CONFIG[f.from] || PAGE_CONFIG['qc-incoming'];
    const cfg = PAGE_CONFIG['qc-report-edit'];
    const isBatch = f.mode !== 'single';
    const orders = (PAGE_CONFIG['production-order'] || {}).data || [];
    const order = f.orderNo ? orders.find(o => o.orderNo === f.orderNo) : null;

    const orderOpts = ['<option value="">请选择工单</option>'].concat(orders.map(o =>
        `<option value="${o.orderNo}" ${f.orderNo === o.orderNo ? 'selected' : ''}>${o.orderNo}（${o.productName}）</option>`)).join('');
    const procOpts = qtOpts(qtProcessOptions(order), f.processName);
    const inspectorOpts = qtOpts(cfg.inspectorOptions, f.inspector);

    // ① 顶部栏
    const topbarHtml = `<div class="detail-topbar">
        <button class="back-icon" onclick="qtBack()" title="返回列表">‹</button>
        <span class="detail-title">添加${config.title}</span>
        <span class="tag tag-info">${config.qcTaskType}</span>
        <span class="tag ${isBatch ? 'tag-info' : 'tag-success'}">${isBatch ? '批量检验' : '单独检验'}</span>
        <span class="detail-actions">
            <button class="btn" onclick="qtBack()">返回列表</button>
            <button class="btn btn-primary" onclick="qtWorkSave()">保存检验单</button>
        </span>
    </div>`;

    // ② 检验类型切换 + 实时统计
    const modeHtml = `<div class="card qce-mode-card"><div class="card-body">
        <div class="qce-mode-left">
            <div class="qce-mode-caption">检验类型（二选一）</div>
            <div class="qce-mode-switch">
                <button type="button" class="qce-mode-btn ${isBatch ? 'active' : ''}" onclick="qtSwitchMode('batch')">
                    <span class="qce-mode-ico">📦</span><span class="qce-mode-name">批量检验</span><span class="qce-mode-desc">整批汇总</span>
                </button>
                <button type="button" class="qce-mode-btn qce-mode-single ${!isBatch ? 'active' : ''}" onclick="qtSwitchMode('single')">
                    <span class="qce-mode-ico">🔍</span><span class="qce-mode-name">单独检验</span><span class="qce-mode-desc">逐件录入</span>
                </button>
            </div>
            <div class="qce-mode-tip">${isBatch
                ? '批量检验：录入整批检验总数与合格数，异常数量、合格率自动计算，并为异常产品登记缺陷明细。'
                : '单独检验：逐件录入产品唯一码与检验结果，检验总数、合格率自动统计，不合格件需登记缺陷信息。'}</div>
        </div>
        <div class="qce-live">
            <div class="qce-live-item"><span class="qce-live-label">检验产品总数</span><span class="qce-live-num" id="qceTotal">-</span></div>
            <div class="qce-live-item ok"><span class="qce-live-label">合格产品数</span><span class="qce-live-num" id="qcePass">-</span></div>
            <div class="qce-live-item bad"><span class="qce-live-label">异常产品数</span><span class="qce-live-num" id="qceDefect">-</span></div>
            <div class="qce-live-item rate"><span class="qce-live-label">合格率</span><span class="qce-live-num" id="qceRate">-</span></div>
            <div class="qce-verdict"><span class="qce-verdict-label">综合判定</span><span class="qce-verdict-tag wait" id="qceVerdict">待检</span></div>
        </div>
    </div></div>`;

    // ③ 基础信息（选工单后自动带出产品与客户）
    const baseHtml = `<div class="card">
        <div class="card-header"><span class="card-title">基础信息</span><span class="qce-card-sub">选择工单后自动带出产品与客户信息</span></div>
        <div class="card-body">
            <div class="form-row">
                <div class="form-item"><label><span class="required">*</span>工单编号</label>
                    <select class="form-select" id="qt-order" onchange="qtOrderChangePage(this)">${orderOpts}</select></div>
                <div class="form-item"><label><span class="required">*</span>工序名称</label>
                    <select class="form-select" id="qt-process">${procOpts}</select></div>
                <div class="form-item"><label><span class="required">*</span>质检人员</label>
                    <select class="form-select" id="qt-inspector">${inspectorOpts}</select></div>
                <div class="form-item"><label><span class="required">*</span>检验时间</label>
                    <input type="datetime-local" class="form-input" id="qt-time" value="${f.inspectTime || ''}" /></div>
            </div>
            <div class="qce-auto-title">工单关联信息（自动带出）</div>
            <div id="qceAutoBox">${qtAutoInfoHtml(order)}</div>
        </div>
    </div>`;

    // ④ 批量检验结果（第二张图样式）
    const batchHtml = `<div class="card">
        <div class="card-header"><span class="card-title">批量检验结果</span><span class="qce-card-sub">整批汇总录入，异常数量与合格率自动计算</span></div>
        <div class="card-body">
            <div class="form-row">
                <div class="form-item"><label><span class="required">*</span>检验产品总数</label>
                    <input type="number" class="form-input" id="qt-total" min="0" placeholder="请输入本批检验总数" value="${f.totalQty}" oninput="qtCalcRefresh()" /></div>
                <div class="form-item"><label><span class="required">*</span>合格产品数</label>
                    <input type="number" class="form-input" id="qt-pass" min="0" placeholder="请输入合格数量" value="${f.passQty}" oninput="qtCalcRefresh()" /></div>
                <div class="form-item"><label>异常产品数<span class="qce-auto-tip">自动</span></label>
                    <input type="text" class="form-input input-readonly" id="qt-defect" value="-" readonly /></div>
                <div class="form-item"><label>合格率<span class="qce-auto-tip">自动</span></label>
                    <input type="text" class="form-input input-readonly" id="qt-rate" value="-" readonly /></div>
            </div>
            <div class="form-row"><div class="form-item qce-form-full"><label>不合格产品码</label>
                <textarea class="form-textarea" id="qt-codes" placeholder="多个产品码用、分隔，如：SN-0762、SN-0763、SN-0789">${prEsc(f.defectCodes)}</textarea></div></div>
            <div class="pr-section-title"><span>缺陷记录明细（异常产品逐条登记，用于报告与追溯）</span>
                <button class="btn btn-sm" onclick="qtDefAddRow()">＋ 添加缺陷记录</button></div>
            <div class="pr-steps-wrap"><table class="pr-steps-table qce-def-table">
                <thead><tr>
                    <th style="width:44px;">#</th><th style="width:130px;">缺陷类型</th><th style="width:100px;">缺陷等级</th>
                    <th style="width:90px;">缺陷数量</th><th style="width:150px;">缺陷原因</th><th style="width:120px;">处理方式</th>
                    <th style="width:120px;">缺陷照片</th><th style="width:56px;">操作</th>
                </tr></thead>
                <tbody id="qceDefBody">${qtDefRowsHtml()}</tbody>
            </table></div>
        </div>
    </div>`;

    // ⑤ 单独检验明细（第三张图样式）
    const singleHtml = `<div class="card">
        <div class="card-header">
            <span class="card-title">单独检验明细（逐件录入）</span>
            <div class="qce-head-btns">
                <button class="btn btn-sm" onclick="qtSingleAllPass()">✓ 全部合格</button>
                <button class="btn btn-primary btn-sm" onclick="qtSingleAddRow()">＋ 添加检验件</button>
            </div>
        </div>
        <div class="card-body">
            <div class="pr-steps-wrap"><table class="pr-steps-table qce-single-table">
                <thead><tr>
                    <th style="width:44px;">#</th><th style="width:170px;">产品唯一码</th><th style="width:130px;">检验项目</th>
                    <th style="width:100px;">检验结果</th><th style="width:96px;">缺陷等级</th><th style="width:140px;">缺陷原因</th>
                    <th style="width:110px;">处理方式</th><th style="width:110px;">检验照片</th><th style="width:56px;">操作</th>
                </tr></thead>
                <tbody id="qceSingleBody">${qtSingleRowsHtml()}</tbody>
            </table></div>
            <div class="qce-single-tip" id="qceSingleTip">${qtSingleTipHtml()}</div>
        </div>
    </div>`;

    // ⑥ 过程图片 + 备注
    const extraHtml = `<div class="card">
        <div class="card-header"><span class="card-title">过程图片与备注</span><span class="qce-card-sub">jpg/png，单张≤2MB，最多9张</span></div>
        <div class="card-body">
            <div class="form-row"><div class="form-item qce-form-full"><label>过程图片</label>
                <div class="qt-upload-row">${qtPhotosHtml()}</div></div></div>
            <div class="form-row"><div class="form-item qce-form-full"><label>备注</label>
                <textarea class="form-textarea" id="qt-remark" placeholder="请输入检验备注">${prEsc(f.remark)}</textarea></div></div>
        </div>
    </div>`;

    // ⑦ 底部操作条
    const footerHtml = `<div class="qce-footer">
        <button class="btn" onclick="qtBack()">返回列表</button>
        <button class="btn btn-primary" onclick="qtWorkSave()">保存检验单</button>
    </div>`;

    return topbarHtml + modeHtml + baseHtml + (isBatch ? batchHtml : singleHtml) + extraHtml + footerHtml;
}

// ===== 保存检验单（写回质检任务列表，可查看质检报告） =====
function qtWorkSave() {
    const f = window._qtForm;
    if (!f) { showMsg('页面已失效，请重新进入', 'error'); return; }
    const get = id => document.getElementById(id);
    const config = PAGE_CONFIG[f.from] || PAGE_CONFIG['qc-incoming'];
    const isBatch = f.mode !== 'single';

    const orderNo = get('qt-order').value;
    const processName = get('qt-process').value;
    const inspector = get('qt-inspector').value;
    const inspectTime = get('qt-time').value;
    const checks = [['qt-order', orderNo, '工单编号'], ['qt-process', processName, '工序名称'], ['qt-inspector', inspector, '质检人员'], ['qt-time', inspectTime, '检验时间']];
    for (const [id, val, label] of checks) {
        if (!val) {
            const el = get(id);
            el.classList.add('form-control-error');
            el.focus();
            showMsg(`请选择/填写${label}`, 'error');
            return;
        }
    }

    let actualQty = 0, passQty = 0, items = [], defects = [], singleItems = [], defectCodes = '';
    if (isBatch) {
        const totalStr = get('qt-total').value;
        const passStr = get('qt-pass').value;
        if (totalStr === '') { get('qt-total').classList.add('form-control-error'); get('qt-total').focus(); showMsg('请填写检验产品总数', 'error'); return; }
        if (passStr === '') { get('qt-pass').classList.add('form-control-error'); get('qt-pass').focus(); showMsg('请填写合格产品数', 'error'); return; }
        actualQty = Number(totalStr) || 0;
        passQty = Number(passStr) || 0;
        if (passQty > actualQty) {
            get('qt-pass').classList.add('form-control-error');
            get('qt-pass').focus();
            showMsg('合格产品数不能大于检验产品总数', 'error');
            return;
        }
        qtDefSyncRows();
        defects = (f.defectRows || []).filter(r => r.type || r.reason || r.qty !== '');
        defectCodes = get('qt-codes').value.trim();
        items = defects.map(d => ({
            item: d.type || '外观不合格',
            result: `${d.reason || '-'}（${d.qty || 0}件，${d.handle || '待处理'}，等级：${d.level || '一般'}）`,
            judge: d.level === '致命' ? '不合格' : (d.handle === '让步接收' ? '让步接收' : '不合格'),
        }));
        items.push({ item: '整批检验汇总', result: `共检验${actualQty}件，合格${passQty}件`, judge: passQty >= actualQty ? '合格' : '返工' });
    } else {
        qtSingleSyncRows();
        singleItems = (f.singleRows || []).filter(r => r.sn || r.item);
        if (!singleItems.length) { showMsg('请至少录入一条单独检验明细', 'error'); return; }
        // 不合格件必须登记缺陷原因
        const badIdx = singleItems.findIndex(r => r.result !== '合格' && !r.reason);
        if (badIdx > -1) { showMsg(`第 ${badIdx + 1} 件判定为不合格，请选择缺陷原因`, 'error'); return; }
        actualQty = singleItems.length;
        passQty = singleItems.filter(r => r.result === '合格').length;
        // 未填唯一码的自动补码（演示环境）
        singleItems = singleItems.map((r, i) => {
            const row = Object.assign({}, r);
            if (!row.sn) row.sn = `SN-${String(Date.now()).slice(-6)}-${String(i + 1).padStart(3, '0')}`;
            return row;
        });
        items = singleItems.map(r => ({
            item: r.item || '-',
            result: r.result === '合格' ? '检验合格' : `${r.reason}（${r.handle || '待处理'}，等级：${r.level || '一般'}）`,
            judge: r.result,
        }));
        defectCodes = singleItems.filter(r => r.result !== '合格').map(r => r.sn).join('、');
    }

    const order = qtFindOrder(orderNo) || {};
    const remark = get('qt-remark').value.trim();
    const passRate = actualQty > 0 ? Number(((passQty / actualQty) * 100).toFixed(1)) : 0;
    const data = {
        orderNo, processName, inspector, remark,
        taskType: config.qcTaskType,
        inspectMode: isBatch ? '批量检验' : '单独检验',
        inspectTime: inspectTime.replace('T', ' '),
        actualQty, passQty, passRate,
        productCode: order.productCode || '', productName: order.productName || '',
        customerOrderNo: order.customerOrderNo || '', customerName: qtCustomerName(order) || '',
        deliveryDate: order.deliveryDate || '', taskQty: order.quantity || actualQty,
        defectCodes,
        photos: JSON.parse(JSON.stringify(window._qtPhotos || [])),
        conclusion: passRate >= 95 ? '合格' : '不合格',
        createTime: nowDateTimeStr(),
        reportNo: 'QR-' + String(Date.now()).slice(-6),
        items,
        defects: isBatch ? JSON.parse(JSON.stringify(defects)) : [],
        singleItems: isBatch ? [] : JSON.parse(JSON.stringify(singleItems)),
    };
    config.data.unshift(data);
    const from = f.from;
    window._qtForm = null;
    window._qtPhotos = [];
    showMsg(`检验单已保存（${data.inspectMode}，合格率 ${passRate}%），点击"查看"可查看质检报告`);
    navigateTo(from, PAGE_CONFIG[from].title);
}

// ===== 质检报告（独立页面，仿纸张样式） =====
function qtReport(idx) {
    const page = currentPage;
    const row = getEqRow(page, idx);
    if (!row) return;
    window._qcReportRow = row;
    window._qcReportFrom = page;
    navigateTo('qc-report', '质检报告');
}

function renderQcReportPage() {
    const row = window._qcReportRow;
    if (!row) return `<div class="card"><div class="card-body"><p>报告不存在</p></div></div>`;
    const failQty = (row.actualQty || 0) - (row.passQty || 0);
    const conclusionCls = row.conclusion === '合格' ? 'qr-pass' : 'qr-fail';
    const infoRow = (l, v) => `<div class="qr-info-item"><span class="qr-info-label">${l}</span><span class="qr-info-value">${fmtDetailVal(v)}</span></div>`;
    const itemRows = (row.items || []).map((it, i) => {
        const judgeCls = it.judge === '合格' ? 'tag-success' : (it.judge === '不合格' ? 'tag-danger' : 'tag-warning');
        return `<tr>
            <td class="pr-seq">${i + 1}</td>
            <td>${fmtDetailVal(it.item)}</td>
            <td>${fmtDetailVal(it.result)}</td>
            <td><span class="tag ${judgeCls}">${it.judge || '-'}</span></td>
        </tr>`;
    }).join('');
    const photos = (row.photos || []).map(p => qcPhotoThumb(p.kind, p.label)).join('');
    const reportNo = row.reportNo || '-';
    return `
        <div class="qr-toolbar">
            <button class="btn" onclick="navigateTo('${window._qcReportFrom || 'qc-incoming'}', '来料检')">← 返回列表</button>
            <button class="btn btn-primary" onclick="showMsg('演示环境：已触发打印')">🖨 打印报告</button>
        </div>
        <div class="qr-paper">
            <div class="qr-head">
                <div class="qr-logo">涂装MES系统</div>
                <div class="qr-title">质 检 报 告</div>
                <div class="qr-sub">QUALITY INSPECTION REPORT</div>
                <div class="qr-stamp ${conclusionCls}">${row.conclusion || '-'}</div>
            </div>
            <div class="qr-meta">
                <span>报告编号：${reportNo}</span>
                <span>检验类型：${row.taskType || '-'}</span>
                <span>签发日期：${(row.inspectTime || row.createTime || '').slice(0, 10)}</span>
            </div>
            <div class="qr-section-title">一、基本信息</div>
            <div class="qr-info-grid">
                ${infoRow('生产订单编号', row.orderNo)}
                ${infoRow('产品编码', row.productCode)}
                ${infoRow('产品名称', row.productName)}
                ${infoRow('工序名称', row.processName)}
                ${infoRow('客户单号', row.customerOrderNo)}
                ${infoRow('客户名称', row.customerName)}
                ${infoRow('交付日期', row.deliveryDate)}
                ${infoRow('任务数量', row.taskQty)}
                ${infoRow('质检人员', row.inspector)}
                ${infoRow('检验时间', row.inspectTime)}
            </div>
            <div class="qr-section-title">二、检验结果摘要</div>
            <div class="qr-stat-grid">
                <div class="qr-stat"><span class="qr-stat-num">${row.actualQty ?? '-'}</span><span class="qr-stat-label">实检数量</span></div>
                <div class="qr-stat"><span class="qr-stat-num qr-ok">${row.passQty ?? '-'}</span><span class="qr-stat-label">合格数量</span></div>
                <div class="qr-stat"><span class="qr-stat-num qr-bad">${failQty}</span><span class="qr-stat-label">不合格数量</span></div>
                <div class="qr-stat"><span class="qr-stat-num ${row.passRate >= 95 ? 'qr-ok' : 'qr-bad'}">${row.passRate ?? '-'}%</span><span class="qr-stat-label">合格率</span></div>
            </div>
            <div class="qr-section-title">三、检验项目明细</div>
            <table class="qr-table">
                <thead><tr><th style="width:44px;">序号</th><th style="width:180px;">检验项目</th><th>检验结果</th><th style="width:110px;">单项判定</th></tr></thead>
                <tbody>${itemRows || `<tr><td colspan="4" class="table-empty">无检验项目明细</td></tr>`}</tbody>
            </table>
            <div class="qr-section-title">四、过程图片</div>
            <div class="qr-photos">${photos || '<span class="c-cell-muted">无过程图片</span>'}</div>
            <div class="qr-section-title">五、检验结论</div>
            <div class="qr-conclusion">
                <p>${row.remark || '按检验方案完成全部项目检验。'}</p>
                <p>综合判定：本批次检验合格率 ${(row.passRate ?? 0)}%，结论为<span class="qr-conclusion-tag ${conclusionCls}">${row.conclusion || '-'}</span>。</p>
            </div>
            <div class="qr-sign">
                <div class="qr-sign-item"><span>检验员：${row.inspector || '-'}</span></div>
                <div class="qr-sign-item"><span>审核人：质量主管</span></div>
                <div class="qr-sign-item"><span>批准人：经理</span></div>
                <div class="qr-sign-item"><span>日期：${(row.inspectTime || row.createTime || '').slice(0, 10)}</span></div>
            </div>
        </div>
    `;
}

// ===== 产品信息追溯：时间轴详情 =====
function qcTraceView(idx) {
    const row = getEqRow('qc-trace', idx);
    if (!row) return;
    const nodeHtml = (row.timeline || []).map(t => {
        const dotCls = t.result === '合格' || t.result === '通过' ? 'tl-dot-ok' : t.result === '不合格' ? 'tl-dot-bad' : 'tl-dot-wait';
        const tagCls = t.result === '合格' || t.result === '通过' ? 'tag-success' : t.result === '不合格' ? 'tag-danger' : 'tag-warning';
        return `<div class="tl-item">
            <div class="tl-left"><span class="tl-time">${t.time}</span></div>
            <div class="tl-center"><span class="tl-dot ${dotCls}"></span></div>
            <div class="tl-right">
                <div class="tl-node">${t.node}<span class="tag ${tagCls}" style="margin-left:8px;">${t.result}</span></div>
                <div class="tl-note">${fmtDetailVal(t.note)}</div>
            </div>
        </div>`;
    }).join('');
    const baseRows = [
        ['产品唯一码', row.sn], ['检验项目', row.itemName], ['状态', row.status], ['生产单号', row.orderNo],
        ['客户信息', row.customerInfo], ['不合格原因', row.defectReason], ['不合格等级', row.defectLevel],
        ['建议处理', row.suggest], ['处理备注', row.handleRemark], ['创建时间', row.createTime], ['创建人', row.creator],
    ].map(([l, v]) => `<tr><td class="wb2-cf-l">${l}</td><td>${fmtDetailVal(v)}</td></tr>`).join('');
    const photoHtml = row.defectPhoto ? qcPhotoThumb(row.defectPhoto.kind, row.defectPhoto.label) : '';
    const html = `<div class="modal-overlay" onclick="if(event.target===this)closeModalDirect()">
        <div class="modal pr-editor-box" onclick="event.stopPropagation()">
            <div class="modal-header"><span class="modal-title">产品追溯详情</span><span class="modal-close" onclick="closeModalDirect()">×</span></div>
            <div class="modal-body">
                <div class="pr-section-title">基本信息</div>
                <table class="wb2-cf-table" style="margin-bottom:6px;"><tbody>${baseRows}</tbody></table>
                ${photoHtml ? `<div class="qc-photo-cell" style="margin:8px 0 14px;">不合格图片：${photoHtml}</div>` : ''}
                <div class="pr-section-title"><span>全流程追溯时间轴</span></div>
                <div class="tl-wrap">${nodeHtml || '<div class="table-empty">暂无追溯记录</div>'}</div>
            </div>
            <div class="modal-footer"><button class="btn btn-primary" onclick="closeModalDirect()">关闭</button></div>
        </div>
    </div>`;
    document.getElementById('modalContainer').innerHTML = html;
}

// ===== 统计页公共：卡片 + 条形图 =====
// 通用简洁统计卡片（库存预警 / 数据趋势 / 加料记录页使用）
// cls 可传警示类名：qr-bad 红色 / inv-num-warn 橙色
function qcStatCards(cards) {
    return `<div class="qc-stat-cards">${cards.map(c => `
        <div class="stat-card qc-stat-card">
            <div class="qc-stat-num ${c.cls || ''}">${c.value}</div>
            <div class="qc-stat-label">${c.label}</div>
        </div>`).join('')}</div>`;
}

// 质检统计页：渐变统计卡片（纯 CSS 渐变背景、白色文字、三级层次 + 环比三角符号）
// trend 为带符号的环比字符串：'+12.5%' 显示 ▲ 上三角，'-8.6%' 显示 ▼ 下三角
function qcGradientCards(cards) {
    return `<div class="qc-grad-cards">${cards.map(c => {
        const up = !String(c.trend).startsWith('-'); // 正数=环比上升▲，负数=环比下降▼
        return `
        <div class="qc-grad-card ${c.theme}">
            <div class="qc-grad-label">${c.label}</div>
            <div class="qc-grad-value">${c.value}</div>
            <div class="qc-grad-trend">${up ? '▲' : '▼'} 环比上月 ${c.trend}</div>
        </div>`;
    }).join('')}</div>`;
}

// 批量质检统计-左侧饼图：质检任务状态分布（普通饼图 + 外部引线标签）
function buildQcStatusPieOption() {
    const list = PAGE_CONFIG['qc-batch'].statusPie;
    return {
        color: list.map(d => d.color),
        // 悬浮提示：名称 / 数量 / 占比百分比（占比按实际数值计算）
        tooltip: {
            trigger: 'item',
            formatter: (p) => `${p.name}<br/>数量：${p.value} 件<br/>占比：${p.percent}%`,
        },
        // 图例放在图表底部
        legend: {
            bottom: 0,
            left: 'center',
            itemWidth: 14,
            itemHeight: 10,
            itemGap: 18,
            textStyle: { color: '#606266', fontSize: 12 },
        },
        series: [{
            type: 'pie',
            radius: '52%',
            center: ['50%', '44%'],
            avoidLabelOverlap: true,
            itemStyle: { borderColor: '#fff', borderWidth: 2 },
            // 外部引线标签：同时显示名称、数值、百分比（文字在图表外侧，引线指向扇区）
            label: {
                show: true,
                position: 'outside',
                formatter: '{b}\n{c}件 ({d}%)',
                color: '#606266',
                fontSize: 12,
                lineHeight: 17,
            },
            labelLine: { show: true, length: 14, length2: 12, lineStyle: { color: '#c0c4cc' } },
            data: list.map(d => ({ name: d.name, value: d.value })),
        }],
    };
}

// 批量质检统计-右侧饼图：检验类型分布（环形甜甜圈 + 中心总数 + 外部引线标签）
function buildQcTypePieOption() {
    const list = PAGE_CONFIG['qc-batch'].typePie;
    const total = list.reduce((s, d) => s + d.value, 0); // 检验总数 2100
    return {
        color: list.map(d => d.color),
        tooltip: {
            trigger: 'item',
            formatter: (p) => `${p.name}<br/>数量：${p.value} 件<br/>占比：${p.percent}%`,
        },
        legend: {
            bottom: 0,
            left: 'center',
            itemWidth: 14,
            itemHeight: 10,
            itemGap: 18,
            textStyle: { color: '#606266', fontSize: 12 },
        },
        // 环形中心文字：检验总数 2100
        title: {
            text: '检验总数',
            subtext: String(total),
            left: 'center',
            top: '36%',
            itemGap: 4,
            textStyle: { color: '#909399', fontSize: 13, fontWeight: 500 },
            subtextStyle: { color: '#303133', fontSize: 24, fontWeight: 700 },
        },
        series: [{
            type: 'pie',
            radius: ['40%', '65%'], // 环形内径约为外径的 0.6
            center: ['50%', '44%'],
            avoidLabelOverlap: true,
            itemStyle: { borderColor: '#fff', borderWidth: 2 },
            // 外部引线标签：名称 + 百分比（文字在图表外侧，引线指向扇区）
            label: {
                show: true,
                position: 'outside',
                formatter: '{b} {d}%',
                color: '#606266',
                fontSize: 12,
            },
            labelLine: { show: true, length: 14, length2: 12, lineStyle: { color: '#c0c4cc' } },
            data: list.map(d => ({ name: d.name, value: d.value })),
        }],
    };
}

// 单独质检统计：各检验项目合格率饼图（环形 + 外部引线标签）
function buildQcItemPieOption() {
    const list = PAGE_CONFIG['qc-single'].chartData; // [{ label, value(合格率%) }]
    const palette = ['#2563eb', '#facc15', '#22c55e', '#06b6d4', '#f24848', '#ffaa00'];
    return {
        color: palette,
        tooltip: {
            trigger: 'item',
            formatter: (p) => `${p.name}<br/>合格率：${p.value}%`,
        },
        legend: {
            bottom: 0,
            left: 'center',
            itemWidth: 14,
            itemHeight: 10,
            itemGap: 16,
            textStyle: { color: '#606266', fontSize: 12 },
        },
        // 环形中心文字：检验项目数
        title: {
            text: '检验项目',
            subtext: list.length + ' 项',
            left: 'center',
            top: '36%',
            itemGap: 4,
            textStyle: { color: '#909399', fontSize: 13, fontWeight: 500 },
            subtextStyle: { color: '#303133', fontSize: 24, fontWeight: 700 },
        },
        series: [{
            type: 'pie',
            radius: ['40%', '65%'],
            center: ['50%', '44%'],
            avoidLabelOverlap: true,
            itemStyle: { borderColor: '#fff', borderWidth: 2 },
            label: {
                show: true,
                position: 'outside',
                formatter: '{b} {c}%',
                color: '#606266',
                fontSize: 12,
            },
            labelLine: { show: true, length: 14, length2: 12, lineStyle: { color: '#c0c4cc' } },
            data: list.map(d => ({ name: d.label, value: d.value })),
        }],
    };
}

// ===== 批量质检统计页 =====
function renderQcBatchPage() {
    const config = PAGE_CONFIG['qc-batch'];
    let html = `<div class="qc-page-head"><h2>${config.title}</h2></div>`;
    // 渐变统计卡片（白色文字三级层次 + 环比三角符号）
    html += qcGradientCards([
        { label: '检验产品总数', value: config.summary.total, theme: 'blue', trend: config.summary.trend.total },
        { label: '合格产品数', value: config.summary.pass, theme: 'green', trend: config.summary.trend.pass },
        { label: '异常产品数', value: config.summary.defect, theme: 'red', trend: config.summary.trend.defect },
        { label: '平均合格率', value: config.summary.avgRate + '%', theme: 'orange', trend: config.summary.trend.avgRate },
    ]);
    // 双饼图同一行：左-质检任务状态分布（普通饼图），右-检验类型分布（环形甜甜圈）
    // 均为外部引线标签（文字在图外侧、引线指向扇区），图例在图表底部
    html += `<div class="qc-row">
        <div class="card qc-chart-card"><div class="card-body">
            <div class="qc-chart-title">质检任务状态分布</div>
            <div id="qcStatusPieChart" class="echart-box qc-pie-box"></div>
        </div></div>
        <div class="card qc-chart-card"><div class="card-body">
            <div class="qc-chart-title">检验类型分布</div>
            <div id="qcTypePieChart" class="echart-box qc-pie-box"></div>
        </div></div>
    </div>`;
    // 搜索栏
    html += `<div class="search-bar">
        <div class="search-item"><span class="search-label">统计日期</span><input type="date" class="search-input" /></div>
        <div class="search-item"><span class="search-label">至</span><input type="date" class="search-input" /></div>
        <div class="search-item"><button class="btn btn-primary" onclick="showMsg('演示环境：已按条件统计')">统计</button></div>
        <div class="search-item"><button class="btn" onclick="showMsg('已重置')">重置</button></div>
    </div>`;
    // 表格
    const cols = [
        ['序号', 50], ['生产单号', 120], ['客户名', 90], ['产品名', 100], ['检验单创建日期', 105],
        ['检验人员', 70], ['检验类型', 85], ['统计日期', 95], ['检验产品总数', 90], ['异常产品数', 80],
        ['合格产品数', 80], ['合格率(%)', 120], ['不合格产品码', 150], ['不合格照片', 120], ['缺陷原因', 110],
    ];
    const rows = config.data.map((r, i) => `<tr>
        <td class="pr-seq">${i + 1}</td>
        <td>${r.orderNo}</td><td>${r.customerName}</td><td>${r.productName}</td><td>${r.reportDate}</td>
        <td>${r.inspector}</td><td><span class="tag tag-info">${r.inspectType}</span></td><td>${r.statDate}</td>
        <td>${r.totalQty}</td><td class="qr-bad">${r.defectQty}</td><td class="qr-ok">${r.passQty}</td>
        <td><div style="display:flex;align-items:center;gap:6px;"><div class="progress-bar" style="flex:1;"><div class="progress-fill ${r.passRate >= 99 ? 'green' : r.passRate >= 95 ? 'blue' : 'orange'}" style="width:${r.passRate}%;"></div></div><span>${r.passRate}%</span></div></td>
        <td class="qc-code-cell">${r.defectCodes}</td>
        <td><div class="qc-photo-cell">${r.defectPhotos.map(p => qcPhotoThumb(p.kind, p.label)).join('')}</div></td>
        <td>${r.defectReason}</td>
    </tr>`).join('');
    html += `<div class="card"><div class="card-body" style="padding:0;"><div class="table-wrapper"><table class="po-table">
        <thead><tr>${cols.map(c => `<th style="width:${c[1]}px;">${c[0]}</th>`).join('')}</tr></thead>
        <tbody>${rows}</tbody>
    </table></div></div></div>`;
    return html;
}

// ===== 单独质检统计页 =====
function renderQcSinglePage() {
    const config = PAGE_CONFIG['qc-single'];
    let html = `<div class="qc-page-head"><h2>${config.title}</h2></div>`;
    // 渐变统计卡片（白色文字三级层次 + 环比三角符号）
    html += qcGradientCards([
        { label: '检验记录总数', value: config.summary.total, theme: 'blue', trend: config.summary.trend.total },
        { label: '合格记录', value: config.summary.pass, theme: 'green', trend: config.summary.trend.pass },
        { label: '不合格记录', value: config.summary.fail, theme: 'red', trend: config.summary.trend.fail },
        { label: '合格率', value: config.summary.passRate + '%', theme: 'orange', trend: config.summary.trend.passRate },
    ]);
    // 各检验项目合格率（%）改为 ECharts 饼图（环形 + 外部引线标签）
    html += `<div class="card qc-chart-card"><div class="card-body">
        <div class="qc-chart-title">各检验项目合格率（%）</div>
        <div id="qcItemPieChart" class="echart-box qc-pie-box"></div>
    </div></div>`;
    // 搜索栏
    html += `<div class="search-bar">
        <div class="search-item"><span class="search-label">检验单创建日期</span><input type="date" class="search-input" /></div>
        <div class="search-item"><span class="search-label">至</span><input type="date" class="search-input" /></div>
        <div class="search-item"><span class="search-label">生产单号</span><input type="text" class="search-input" placeholder="请输入生产单号" /></div>
        <div class="search-item"><span class="search-label">产品唯一码</span><input type="text" class="search-input" placeholder="请输入产品唯一码" /></div>
        <div class="search-item"><span class="search-label">检验结果</span>
            <select class="search-select"><option>全部</option><option>合格</option><option>不合格</option></select>
        </div>
        <div class="search-item"><button class="btn btn-primary" onclick="showMsg('演示环境：已按条件统计')">搜索</button></div>
    </div>`;
    const cols = ['序号', '产品唯一码', '生产单号', '工序名称', '质检方案', '客户名', '产品名', '检验单创建日期', '检验人员', '检验项目', '检验结果', '检验照片', '缺陷原因'];
    const rows = config.data.map((r, i) => `<tr>
        <td class="pr-seq">${i + 1}</td>
        <td>${r.sn}</td><td>${r.orderNo}</td><td>${r.processName}</td><td>${r.planName}</td>
        <td>${r.customerName}</td><td>${r.productName}</td><td>${r.reportDate}</td><td>${r.inspector}</td>
        <td>${r.itemName}</td>
        <td><span class="tag ${r.result === '合格' ? 'tag-success' : 'tag-danger'}">${r.result}</span></td>
        <td><div class="qc-photo-cell">${r.photos.map(p => qcPhotoThumb(p.kind, p.label)).join('')}</div></td>
        <td>${r.defectReason}</td>
    </tr>`).join('');
    html += `<div class="card"><div class="card-body" style="padding:0;"><div class="table-wrapper"><table class="po-table">
        <thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead>
        <tbody>${rows}</tbody>
    </table></div></div></div>`;
    return html;
}

// ============================================================
// 库存模块：库存查询 / 其他入库 / 其他出库 / 销售出库 / 库存预警
// 出入库单据保存、库存调整、单据删除均实时联动库存与出入库流水
// ============================================================
const INV_EDIT_FROM = { 'inv-in-edit': 'inv-in-list', 'inv-out-edit': 'inv-out-list', 'inv-sales-edit': 'inv-sales-list' };

// ---- 工具 ----
function invTodayStr() {
    const n = new Date(); const p = x => String(x).padStart(2, '0');
    return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}`;
}
function invGenSn(prefix) {
    const n = new Date(); const p = x => String(x).padStart(2, '0');
    return `${prefix}${n.getFullYear()}${p(n.getMonth() + 1)}${p(n.getDate())}${Math.floor(100 + Math.random() * 900)}`;
}
function invFindStock(productCode) {
    return PAGE_CONFIG['inv-stock'].data.find(r => r.productCode === productCode);
}
function invProductCodeByName(name) {
    const p = PAGE_CONFIG['product-list'].data.find(x => x.name === name);
    return p ? p.code : null;
}
// 应用库存变动并记录流水（delta 正=入库 负=出库）
function invApplyChange(productCode, delta, reason, operator) {
    const stock = invFindStock(productCode);
    if (!stock) return false;
    stock.quantity = (Number(stock.quantity) || 0) + (Number(delta) || 0);
    INV_STOCK_LOGS.unshift({ productCode, time: nowDateTimeStr(), qty: Number(delta) || 0, reason, operator: operator || 'admin' });
    return true;
}

// ---- 库存查询页 ----
function renderInvStockPage() {
    const config = PAGE_CONFIG['inv-stock'];
    const kw = (window._invStockKw || '').trim().toLowerCase();
    const rows = kw ? config.data.filter(r => `${r.productCode} ${r.productName}`.toLowerCase().includes(kw)) : config.data.slice();
    window._invStockView = rows;
    let html = `<div class="search-bar">
        <div class="search-item"><span class="search-label">关键字</span><input type="text" class="search-input" id="inv-stock-kw" placeholder="请输入名称或者编码搜索" value="${prEsc(window._invStockKw || '')}" onkeydown="if(event.key==='Enter')invStockSearch()" /></div>
        <div class="search-item"><button class="btn btn-primary" onclick="invStockSearch()">搜索</button></div>
        <div class="search-item"><button class="btn" onclick="invStockReset()">重置</button></div>
    </div>
    <div class="toolbar">
        <button class="btn" onclick="navigateTo('inv-stock','库存查询')">刷新</button>
        <button class="btn" onclick="showMsg('演示环境：已导出 库存列表.xlsx')">导出</button>
    </div>
    <div class="table-wrapper"><table><thead><tr>
        <th style="min-width:130px;">产品编码</th><th>描述</th><th style="min-width:120px;">规格</th><th style="min-width:100px;">材质</th><th style="min-width:70px;">单位</th><th style="min-width:90px;">库存</th><th>备注</th><th style="min-width:180px;">操作</th>
    </tr></thead><tbody>`;
    if (rows.length) {
        rows.forEach((r, i) => {
            const qtyCls = (r.alertMin && Number(r.quantity) < Number(r.alertMin)) ? 'inv-num-neg' : ((r.alertMax && Number(r.quantity) > Number(r.alertMax)) ? 'inv-num-warn' : '');
            html += `<tr>
                <td>${r.productCode}</td><td>${r.productName}</td><td>${r.specification || '-'}</td><td>${r.material || '-'}</td><td>${r.unit || '-'}</td>
                <td class="${qtyCls}" style="font-weight:600;">${r.quantity}</td><td>${r.remarks || '-'}</td>
                <td><button class="btn-text-link" onclick="invAdjust(${i})">调整库存</button><button class="btn-text-link" onclick="invLogs(${i})">出入库明细</button></td>
            </tr>`;
        });
    } else {
        html += `<tr><td colspan="8" class="table-empty">暂无数据</td></tr>`;
    }
    html += `</tbody></table>${rows.length ? renderPagination(rows.length) : ''}</div>`;
    return html;
}
function invStockSearch() {
    const el = document.getElementById('inv-stock-kw');
    window._invStockKw = el ? el.value : '';
    document.getElementById('content').innerHTML = renderInvStockPage();
}
function invStockReset() {
    window._invStockKw = '';
    document.getElementById('content').innerHTML = renderInvStockPage();
}

// ---- 调整库存 ----
function invAdjust(idx) {
    const r = (window._invStockView || PAGE_CONFIG['inv-stock'].data)[idx];
    if (!r) return;
    window._invAdjustCode = r.productCode;
    const html = `<div class="modal-overlay" onclick="if(event.target===this)closeModalDirect()">
        <div class="modal" onclick="event.stopPropagation()">
            <div class="modal-header"><span class="modal-title">调整库存 - ${r.productName}</span><span class="modal-close" onclick="closeModalDirect()">×</span></div>
            <div class="modal-body">
                <div class="form-row">
                    <div class="form-item"><label>当前库存</label><input type="text" class="form-input input-readonly" readonly value="${r.quantity} ${r.unit || ''}"></div>
                    <div class="form-item"><label><span class="required">*</span>调整为</label><input type="number" class="form-input" id="inv-adjust-target" placeholder="请输入调整后数量" min="0"></div>
                </div>
                <div class="form-row">
                    <div class="form-item" style="width:100%;"><label>变更原因</label><input type="text" class="form-input" id="inv-adjust-reason" placeholder="请输入变更原因，如：盘点调整"></div>
                </div>
            </div>
            <div class="modal-footer"><button class="btn" onclick="closeModalDirect()">取消</button><button class="btn btn-primary" onclick="invAdjustSave()">确定</button></div>
        </div>
    </div>`;
    document.getElementById('modalContainer').innerHTML = html;
}
function invAdjustSave() {
    const stock = invFindStock(window._invAdjustCode);
    if (!stock) return;
    const el = document.getElementById('inv-adjust-target');
    const reasonEl = document.getElementById('inv-adjust-reason');
    const target = Number(el.value);
    if (el.value === '' || isNaN(target) || target < 0) { el.classList.add('form-control-error'); el.focus(); showMsg('请输入正确的调整数量', 'error'); return; }
    const delta = target - Number(stock.quantity);
    if (delta === 0) { closeModalDirect(); showMsg('库存无变化'); return; }
    stock.quantity = target;
    INV_STOCK_LOGS.unshift({ productCode: stock.productCode, time: nowDateTimeStr(), qty: delta, reason: reasonEl.value.trim() || '库存调整', operator: 'admin' });
    closeModalDirect();
    showMsg('调整成功');
    navigateTo('inv-stock', '库存查询');
}

// ---- 出入库明细 ----
function invLogs(idx) {
    const r = (window._invStockView || PAGE_CONFIG['inv-stock'].data)[idx];
    if (!r) return;
    const logs = INV_STOCK_LOGS.filter(l => l.productCode === r.productCode);
    const rows = logs.map(l => `<tr>
        <td>${l.time}</td><td>${l.productName || r.productName}</td>
        <td class="${l.qty >= 0 ? 'inv-num-pos' : 'inv-num-neg'}" style="font-weight:600;">${l.qty >= 0 ? '+' + l.qty : l.qty}</td>
        <td>${l.reason}</td><td>${l.operator}</td>
    </tr>`).join('');
    const html = `<div class="modal-overlay" onclick="if(event.target===this)closeModalDirect()">
        <div class="modal pr-editor-box" onclick="event.stopPropagation()">
            <div class="modal-header"><span class="modal-title">出入库明细 - ${r.productName}（${r.productCode}）</span><span class="modal-close" onclick="closeModalDirect()">×</span></div>
            <div class="modal-body">
                <div class="pr-steps-wrap"><table class="pr-steps-table" style="min-width:640px;">
                    <thead><tr><th style="width:150px;">操作时间</th><th style="width:130px;">产品名称</th><th style="width:110px;">出入库数量</th><th>变更原因</th><th style="width:80px;">操作人</th></tr></thead>
                    <tbody>${rows || `<tr><td colspan="5" class="table-empty">暂无出入库记录</td></tr>`}</tbody>
                </table></div>
            </div>
            <div class="modal-footer"><button class="btn btn-primary" onclick="closeModalDirect()">关闭</button></div>
        </div>
    </div>`;
    document.getElementById('modalContainer').innerHTML = html;
}

// ---- 入库/出库单编辑器（独立页面） ----
function siEmptyRow() {
    return { productCode: '', productName: '', specification: '', material: '', unit: '', quantity: '', remarks: '' };
}
function siAdd() {
    const isIn = currentPage === 'inv-in-list';
    window._siDir = isIn ? 'IN' : 'OUT';
    window._siEditSn = null;
    window._siRows = [siEmptyRow(), siEmptyRow(), siEmptyRow(), siEmptyRow(), siEmptyRow()];
    window._siForm = { orderDate: invTodayStr(), sn: invGenSn(isIn ? 'RK' : 'CK'), memo: '' };
    navigateTo(isIn ? 'inv-in-edit' : 'inv-out-edit', isIn ? '新增入库单' : '新增出库单');
}
function siEditNav(idx) {
    const page = currentPage;
    const row = getEqRow(page, idx);
    if (!row) return;
    const isIn = page === 'inv-in-list';
    window._siDir = isIn ? 'IN' : 'OUT';
    window._siEditSn = row.sn;
    window._siRows = (row.items || []).map(it => Object.assign(siEmptyRow(), it));
    if (!window._siRows.length) window._siRows = [siEmptyRow()];
    window._siForm = { orderDate: (row.createTime || '').slice(0, 10), sn: row.sn, memo: row.memo || '' };
    navigateTo(isIn ? 'inv-in-edit' : 'inv-out-edit', isIn ? '编辑入库单' : '编辑出库单');
}
function invBackToList() {
    const from = INV_EDIT_FROM[currentPage] || (window._siDir === 'IN' ? 'inv-in-list' : 'inv-out-list');
    const titles = { 'inv-in-list': '其他入库', 'inv-out-list': '其他出库', 'inv-sales-list': '销售出库' };
    window._siEditSn = null;
    navigateTo(from, titles[from] || '库存管理');
}
function siRowsHtml() {
    const rows = window._siRows || [];
    if (!rows.length) return `<tr><td colspan="9" class="table-empty">暂无明细行，点击"添加行"新增</td></tr>`;
    return rows.map((r, i) => `<tr>
        <td class="pr-seq">${i + 1}</td>
        <td><div class="inv-pick-cell">
            <span class="inv-pick-name" title="${prEsc(r.productName)}">${r.productCode ? prEsc(r.productName) : '<span class="c-cell-muted">未选择</span>'}</span>
            <button class="btn btn-sm" onclick="siPickProduct(${i})">选择产品</button>
        </div></td>
        <td>${r.productCode || '-'}</td>
        <td>${r.specification || '-'}</td>
        <td>${r.material || '-'}</td>
        <td>${r.unit || '-'}</td>
        <td><input type="number" class="form-input inv-num-input" min="0" value="${r.quantity ?? ''}" placeholder="0" onchange="siRowChange(${i}, 'quantity', this.value)"></td>
        <td><input type="text" class="form-input inv-txt-input" value="${prEsc(r.remarks)}" placeholder="备注" onchange="siRowChange(${i}, 'remarks', this.value)"></td>
        <td><button class="btn-text-link danger" onclick="siRemoveRow(${i})">删除</button></td>
    </tr>`).join('');
}
function renderInvOpEditPage() {
    const isIn = window._siDir === 'IN';
    const f = window._siForm || { orderDate: invTodayStr(), sn: invGenSn(isIn ? 'RK' : 'CK'), memo: '' };
    const title = window._siEditSn ? (isIn ? '编辑入库单' : '编辑出库单') : (isIn ? '新增入库单' : '新增出库单');
    let html = `<div class="detail-topbar">
        <button class="back-icon" onclick="invBackToList()" title="返回">‹</button>
        <span class="detail-title">${title}</span>
        ${window._siEditSn ? `<span class="tag tag-info">${window._siEditSn}</span>` : ''}
        <span class="detail-actions">
            <button class="btn" onclick="invBackToList()">返回</button>
            <button class="btn btn-primary" onclick="siSave()">保存</button>
        </span>
    </div>
    <div class="card"><div class="card-header"><span class="card-title">基本信息</span></div><div class="card-body">
        <div class="form-row">
            <div class="form-item"><label><span class="required">*</span>制单时间</label><input type="date" class="form-input" id="si-date" value="${f.orderDate}"></div>
            <div class="form-item"><label>单据编号</label><input type="text" class="form-input input-readonly" readonly value="${prEsc(f.sn)}"></div>
            <div class="form-item"><label>备注</label><input type="text" class="form-input" id="si-memo" placeholder="请输入备注" value="${prEsc(f.memo)}"></div>
        </div>
    </div></div>
    <div class="card"><div class="card-header" style="display:flex;align-items:center;justify-content:space-between;"><span class="card-title">${isIn ? '入库明细' : '出库明细'}</span>
        <button class="btn btn-primary btn-sm" onclick="siAddRow()">＋ 添加行</button></div>
    <div class="card-body">
        <div class="pr-steps-wrap"><table class="pr-steps-table" style="min-width:960px;">
            <thead><tr><th style="width:44px;">#</th><th style="width:200px;">品名</th><th style="width:110px;">货号</th><th>规格</th><th style="width:110px;">材质</th><th style="width:64px;">单位</th><th style="width:100px;">数量</th><th>备注</th><th style="width:56px;">操作</th></tr></thead>
            <tbody id="si-rows-body">${siRowsHtml()}</tbody>
        </table></div>
        <div class="inv-total-bar">数量合计：<span id="si-total">${(window._siRows || []).reduce((s, r) => s + (Number(r.quantity) || 0), 0)}</span></div>
    </div></div>`;
    return html;
}
function siRenderBody() {
    const tb = document.getElementById('si-rows-body');
    if (tb) tb.innerHTML = siRowsHtml();
    const el = document.getElementById('si-total');
    if (el) el.textContent = (window._siRows || []).reduce((s, r) => s + (Number(r.quantity) || 0), 0);
}
function siRowChange(i, key, val) {
    const rows = window._siRows || [];
    if (rows[i]) rows[i][key] = (key === 'quantity') ? (val === '' ? '' : Number(val)) : val;
    const el = document.getElementById('si-total');
    if (el) el.textContent = rows.reduce((s, r) => s + (Number(r.quantity) || 0), 0);
}
function siAddRow() {
    (window._siRows = window._siRows || []).push(siEmptyRow());
    siRenderBody();
}
function siRemoveRow(i) {
    (window._siRows || []).splice(i, 1);
    siRenderBody();
}

// ---- 产品选择弹窗（入库/出库/销售出库共用） ----
function siPickProduct(i) {
    window._invPickingRow = i;
    window._invPickingTarget = 'si';
    const html = `<div class="modal-overlay" onclick="if(event.target===this)closeModalDirect()">
        <div class="modal pr-editor-box" onclick="event.stopPropagation()">
            <div class="modal-header"><span class="modal-title">选择产品</span><span class="modal-close" onclick="closeModalDirect()">×</span></div>
            <div class="modal-body">
                <div class="search-bar" style="margin-bottom:12px;">
                    <div class="search-item"><span class="search-label">关键字</span><input type="text" class="search-input" id="inv-pick-kw" placeholder="请输入产品编码或名称" onkeydown="if(event.key==='Enter')invPickFilter()"></div>
                    <div class="search-item"><button class="btn btn-primary" onclick="invPickFilter()">搜索</button></div>
                </div>
                <div class="pr-steps-wrap"><table class="pr-steps-table" style="min-width:640px;">
                    <thead><tr><th style="width:130px;">产品编码</th><th>产品名称</th><th style="width:150px;">规格</th><th style="width:120px;">材质</th><th style="width:70px;">操作</th></tr></thead>
                    <tbody id="inv-pick-body"></tbody>
                </table></div>
            </div>
            <div class="modal-footer"><button class="btn" onclick="closeModalDirect()">取消</button></div>
        </div>
    </div>`;
    document.getElementById('modalContainer').innerHTML = html;
    invPickFilter();
}
function invPickFilter() {
    const kwEl = document.getElementById('inv-pick-kw');
    const lkw = kwEl ? kwEl.value.trim().toLowerCase() : '';
    const products = PAGE_CONFIG['product-list'].data.filter(p => !lkw || `${p.code} ${p.name}`.toLowerCase().includes(lkw));
    const rows = products.map(p => `<tr>
        <td>${p.code}</td><td>${p.name}</td><td>${p.spec || '-'}</td><td>${p.material || '-'}</td>
        <td><button class="btn-text-link" onclick="invPickSelect('${p.code}')">选择</button></td>
    </tr>`).join('');
    const tb = document.getElementById('inv-pick-body');
    if (tb) tb.innerHTML = rows || `<tr><td colspan="5" class="table-empty">未找到产品</td></tr>`;
}
function invPickSelect(code) {
    const p = PAGE_CONFIG['product-list'].data.find(x => x.code === code);
    if (!p) return;
    const i = window._invPickingRow;
    const st = invFindStock(code);
    if (window._invPickingTarget === 'so') {
        const rows = window._soRows || [];
        if (rows[i]) {
            rows[i].productCode = p.code;
            rows[i].productName = p.name;
            rows[i].specification = p.spec || (st ? st.specification : '') || '-';
        }
        closeModalDirect();
        soRenderBody();
        return;
    }
    const rows = window._siRows || [];
    if (rows[i]) {
        rows[i].productCode = p.code;
        rows[i].productName = p.name;
        rows[i].specification = p.spec || (st ? st.specification : '') || '-';
        rows[i].material = p.material || (st ? st.material : '') || '-';
        rows[i].unit = st ? st.unit : '件';
    }
    closeModalDirect();
    siRenderBody();
}

// ---- 入库/出库单：查看 ----
function siView(idx) {
    const isIn = currentPage === 'inv-in-list';
    const row = getEqRow(currentPage, idx);
    if (!row) return;
    const total = (row.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0);
    const baseRows = [
        ['订单号', row.sn], ['单据类型', isIn ? '其他入库' : '其他出库'], ['创建时间', row.createTime], ['创建人', row.createrName], ['备注', row.memo],
    ].map(([l, v]) => `<tr><td class="wb2-cf-l">${l}</td><td>${fmtDetailVal(v)}</td></tr>`).join('');
    const itemRows = (row.items || []).map((it, i) => `<tr>
        <td class="pr-seq">${i + 1}</td>
        <td>${fmtDetailVal(it.productName)}</td><td>${fmtDetailVal(it.productCode)}</td><td>${fmtDetailVal(it.specification)}</td>
        <td>${fmtDetailVal(it.material)}</td><td>${fmtDetailVal(it.unit)}</td><td>${fmtDetailVal(it.quantity)}</td><td>${fmtDetailVal(it.remarks)}</td>
    </tr>`).join('');
    const html = `<div class="modal-overlay" onclick="if(event.target===this)closeModalDirect()">
        <div class="modal pr-editor-box" onclick="event.stopPropagation()">
            <div class="modal-header"><span class="modal-title">${isIn ? '入库单详情' : '出库单详情'}</span><span class="modal-close" onclick="closeModalDirect()">×</span></div>
            <div class="modal-body">
                <div class="pr-section-title">基本信息</div>
                <table class="wb2-cf-table" style="margin-bottom:16px;"><tbody>${baseRows}</tbody></table>
                <div class="pr-section-title"><span>单据明细</span></div>
                <div class="pr-steps-wrap"><table class="pr-steps-table" style="min-width:760px;">
                    <thead><tr><th style="width:44px;">#</th><th>品名</th><th style="width:110px;">货号</th><th>规格</th><th style="width:100px;">材质</th><th style="width:64px;">单位</th><th style="width:80px;">数量</th><th>备注</th></tr></thead>
                    <tbody>${itemRows || `<tr><td colspan="8" class="table-empty">暂无明细</td></tr>`}</tbody>
                </table></div>
                <div class="inv-total-bar">数量合计：<span>${total}</span></div>
            </div>
            <div class="modal-footer"><button class="btn btn-primary" onclick="closeModalDirect()">关闭</button></div>
        </div>
    </div>`;
    document.getElementById('modalContainer').innerHTML = html;
}

// ---- 入库/出库单：保存（库存联动） ----
function siSave() {
    const isIn = window._siDir === 'IN';
    const dateVal = document.getElementById('si-date').value;
    if (!dateVal) { showMsg('请选择制单时间', 'error'); return; }
    const memo = document.getElementById('si-memo').value.trim();
    const rows = (window._siRows || []).filter(r => r.productCode && Number(r.quantity) > 0);
    if (!rows.length) { showMsg('请至少填写一行产品明细（品名和数量）', 'error'); return; }
    if (!isIn) {
        const need = {};
        rows.forEach(r => need[r.productCode] = (need[r.productCode] || 0) + Number(r.quantity));
        for (const code of Object.keys(need)) {
            const st = invFindStock(code);
            if (!st) { showMsg(`产品 ${code} 无库存记录，无法出库`, 'error'); return; }
            if (Number(st.quantity) < need[code]) { showMsg(`${st.productName} 库存不足（当前 ${st.quantity}，需出库 ${need[code]}）`, 'error'); return; }
        }
    }
    const listPage = isIn ? 'inv-in-list' : 'inv-out-list';
    const sn = window._siForm.sn;
    if (window._siEditSn) {
        const row = PAGE_CONFIG[listPage].data.find(d => d.sn === window._siEditSn);
        if (row) {
            (row.items || []).forEach(it => invApplyChange(it.productCode, isIn ? -Number(it.quantity) : Number(it.quantity), `编辑单据 ${sn} 回退原数量`, 'admin'));
            row.createTime = nowDateTimeStr();
            row.memo = memo;
            row.items = JSON.parse(JSON.stringify(rows));
        }
    } else {
        PAGE_CONFIG[listPage].data.unshift({ sn, createTime: nowDateTimeStr(), createrName: 'admin', memo, items: JSON.parse(JSON.stringify(rows)) });
    }
    rows.forEach(r => invApplyChange(r.productCode, isIn ? Number(r.quantity) : -Number(r.quantity), `${isIn ? '其他入库' : '其他出库'}（${sn}）`, 'admin'));
    window._siEditSn = null;
    window._siRows = null;
    showMsg('保存成功，库存已同步更新');
    navigateTo(listPage, isIn ? '其他入库' : '其他出库');
}

// ---- 销售出库编辑器（独立页面） ----
function soEmptyRow() {
    return { productCode: '', productName: '', specification: '', processName: '电泳', quantity: '', totalWeight: '', boxCount: '', remarks: '' };
}
function soAdd() {
    window._soEditSn = null;
    window._soRows = [soEmptyRow()];
    window._soForm = { orderNo: invGenSn('XS'), partnerName: '', outboundDate: invTodayStr(), remarks: '' };
    navigateTo('inv-sales-edit', '新建销售出库单');
}
const INV_PROC_OPTIONS = ['电泳', '底漆', '面漆', '清漆', '喷粉', '包装'];
function soRowsHtml() {
    const rows = window._soRows || [];
    if (!rows.length) return `<tr><td colspan="8" class="table-empty">暂无明细，点击"添加产品"新增</td></tr>`;
    return rows.map((r, i) => `<tr>
        <td class="pr-seq">${i + 1}</td>
        <td><div class="inv-pick-cell">
            <span class="inv-pick-name" title="${prEsc(r.productName)}">${r.productCode ? prEsc(r.productName) : '<span class="c-cell-muted">未选择</span>'}</span>
            <button class="btn btn-sm" onclick="soPickProduct(${i})">选择产品</button>
        </div></td>
        <td>${r.specification || '-'}</td>
        <td><select class="form-select inv-proc-select" onchange="soRowChange(${i}, 'processName', this.value)">${INV_PROC_OPTIONS.map(t => `<option value="${t}" ${r.processName === t ? 'selected' : ''}>${t}</option>`).join('')}</select></td>
        <td><input type="number" class="form-input inv-num-input" min="0" value="${r.quantity ?? ''}" placeholder="0" onchange="soRowChange(${i}, 'quantity', this.value)"></td>
        <td><input type="number" class="form-input inv-num-input" min="0" value="${r.totalWeight ?? ''}" placeholder="0" onchange="soRowChange(${i}, 'totalWeight', this.value)"></td>
        <td><input type="number" class="form-input inv-num-input" min="0" value="${r.boxCount ?? ''}" placeholder="0" onchange="soRowChange(${i}, 'boxCount', this.value)"></td>
        <td><button class="btn-text-link danger" onclick="soRemoveRow(${i})">删除</button></td>
    </tr>`).join('');
}
function renderInvSalesEditPage() {
    const f = window._soForm || { orderNo: invGenSn('XS'), partnerName: '', outboundDate: invTodayStr(), remarks: '' };
    const partnerOpts = ['<option value="">请选择收货单位</option>'].concat(INV_PARTNERS.map(p => `<option value="${p}" ${f.partnerName === p ? 'selected' : ''}>${p}</option>`)).join('');
    let html = `<div class="detail-topbar">
        <button class="back-icon" onclick="invBackToList()" title="返回">‹</button>
        <span class="detail-title">新建销售出库单</span>
        <span class="detail-actions">
            <button class="btn" onclick="invBackToList()">取消</button>
            <button class="btn btn-primary" onclick="soSave()">保存并出库</button>
        </span>
    </div>
    <div class="card"><div class="card-header"><span class="card-title">基本信息</span></div><div class="card-body">
        <div class="form-row">
            <div class="form-item"><label><span class="required">*</span>收货单位</label><select class="form-select" id="so-partner">${partnerOpts}</select></div>
            <div class="form-item"><label><span class="required">*</span>出库日期</label><input type="date" class="form-input" id="so-date" value="${f.outboundDate}"></div>
            <div class="form-item"><label>备注</label><input type="text" class="form-input" id="so-remarks" placeholder="请输入备注" value="${prEsc(f.remarks)}"></div>
        </div>
    </div></div>
    <div class="card"><div class="card-header" style="display:flex;align-items:center;justify-content:space-between;"><span class="card-title">出库明细</span>
        <button class="btn btn-primary btn-sm" onclick="soAddRow()">＋ 添加产品</button></div>
    <div class="card-body">
        <div class="pr-steps-wrap"><table class="pr-steps-table" style="min-width:900px;">
            <thead><tr><th style="width:44px;">序号</th><th style="width:200px;">产品</th><th>规格</th><th style="width:100px;">工序</th><th style="width:100px;">送货数</th><th style="width:100px;">总重(kg)</th><th style="width:90px;">箱数</th><th style="width:56px;">操作</th></tr></thead>
            <tbody id="so-rows-body">${soRowsHtml()}</tbody>
        </table></div>
        <div class="inv-total-bar" id="so-totals"></div>
    </div></div>`;
    return html;
}
function soTotals() {
    const rows = window._soRows || [];
    const sum = k => rows.reduce((s, r) => s + (Number(r[k]) || 0), 0);
    return `送货数合计：<span>${sum('quantity')}</span>&nbsp;&nbsp;总重合计：<span>${sum('totalWeight')}kg</span>&nbsp;&nbsp;箱数合计：<span>${sum('boxCount')}</span>`;
}
function soRenderBody() {
    const tb = document.getElementById('so-rows-body');
    if (tb) tb.innerHTML = soRowsHtml();
    const el = document.getElementById('so-totals');
    if (el) el.innerHTML = soTotals();
}
function soRowChange(i, key, val) {
    const rows = window._soRows || [];
    if (rows[i]) rows[i][key] = ['quantity', 'totalWeight', 'boxCount'].includes(key) ? (val === '' ? '' : Number(val)) : val;
    const el = document.getElementById('so-totals');
    if (el) el.innerHTML = soTotals();
}
function soAddRow() {
    (window._soRows = window._soRows || []).push(soEmptyRow());
    soRenderBody();
}
function soRemoveRow(i) {
    (window._soRows || []).splice(i, 1);
    soRenderBody();
}
function soPickProduct(i) {
    window._invPickingRow = i;
    window._invPickingTarget = 'so';
    siPickProduct(i);
    window._invPickingTarget = 'so';
}
function soSave() {
    const partnerName = document.getElementById('so-partner').value;
    if (!partnerName) { showMsg('请选择收货单位', 'error'); return; }
    const outboundDate = document.getElementById('so-date').value;
    if (!outboundDate) { showMsg('请选择出库日期', 'error'); return; }
    const remarks = document.getElementById('so-remarks').value.trim();
    const rows = (window._soRows || []).filter(r => r.productCode && Number(r.quantity) > 0);
    if (!rows.length) { showMsg('请至少添加一行产品明细（产品和送货数）', 'error'); return; }
    const need = {};
    rows.forEach(r => need[r.productCode] = (need[r.productCode] || 0) + Number(r.quantity));
    for (const code of Object.keys(need)) {
        const st = invFindStock(code);
        if (!st) { showMsg(`产品 ${code} 无库存记录，无法出库`, 'error'); return; }
        if (Number(st.quantity) < need[code]) { showMsg(`${st.productName} 库存不足（当前 ${st.quantity}，需出库 ${need[code]}）`, 'error'); return; }
    }
    const orderNo = (window._soForm || {}).orderNo || invGenSn('XS');
    const totalQuantity = rows.reduce((s, r) => s + Number(r.quantity), 0);
    const productNames = [...new Set(rows.map(r => r.productName))].join('、');
    PAGE_CONFIG['inv-sales-list'].data.unshift({ orderNo, partnerName, outboundDate, productNames, totalQuantity, operatorName: 'admin', remarks, createTime: nowDateTimeStr(), items: JSON.parse(JSON.stringify(rows)) });
    rows.forEach(r => invApplyChange(r.productCode, -Number(r.quantity), `销售出库（${orderNo}）`, 'admin'));
    window._soRows = null;
    showMsg('保存成功，库存已扣减');
    navigateTo('inv-sales-list', '销售出库');
}

// ---- 销售出库：查看 ----
function soView(idx) {
    const row = getEqRow('inv-sales-list', idx);
    if (!row) return;
    const baseRows = [
        ['单号', row.orderNo], ['收货单位', row.partnerName], ['出库日期', row.outboundDate], ['送货数合计', row.totalQuantity], ['操作员', row.operatorName], ['备注', row.remarks], ['创建时间', row.createTime],
    ].map(([l, v]) => `<tr><td class="wb2-cf-l">${l}</td><td>${fmtDetailVal(v)}</td></tr>`).join('');
    const itemRows = (row.items || []).map((it, i) => `<tr>
        <td class="pr-seq">${i + 1}</td>
        <td>${fmtDetailVal(it.productName)}</td><td>${fmtDetailVal(it.specification)}</td><td>${fmtDetailVal(it.processName)}</td>
        <td>${fmtDetailVal(it.quantity)}</td><td>${fmtDetailVal(it.totalWeight)}</td><td>${fmtDetailVal(it.boxCount)}</td><td>${fmtDetailVal(it.remarks)}</td>
    </tr>`).join('');
    const html = `<div class="modal-overlay" onclick="if(event.target===this)closeModalDirect()">
        <div class="modal pr-editor-box" onclick="event.stopPropagation()">
            <div class="modal-header"><span class="modal-title">销售出库单详情</span><span class="modal-close" onclick="closeModalDirect()">×</span></div>
            <div class="modal-body">
                <div class="pr-section-title">基本信息</div>
                <table class="wb2-cf-table" style="margin-bottom:16px;"><tbody>${baseRows}</tbody></table>
                <div class="pr-section-title"><span>出库明细</span></div>
                <div class="pr-steps-wrap"><table class="pr-steps-table" style="min-width:760px;">
                    <thead><tr><th style="width:44px;">序号</th><th>产品</th><th>规格</th><th style="width:80px;">工序</th><th style="width:90px;">送货数</th><th style="width:90px;">总重(kg)</th><th style="width:70px;">箱数</th><th>备注</th></tr></thead>
                    <tbody>${itemRows || `<tr><td colspan="8" class="table-empty">暂无明细</td></tr>`}</tbody>
                </table></div>
            </div>
            <div class="modal-footer"><button class="btn btn-primary" onclick="closeModalDirect()">关闭</button></div>
        </div>
    </div>`;
    document.getElementById('modalContainer').innerHTML = html;
}

// ---- 销售出库：打印预览（仿纸质送货单） ----
function soPrint(idx) {
    const row = getEqRow('inv-sales-list', idx);
    if (!row) return;
    const sum = k => (row.items || []).reduce((s, it) => s + (Number(it[k]) || 0), 0);
    const infoRow = (l, v) => `<div class="qr-info-item"><span class="qr-info-label">${l}</span><span class="qr-info-value">${fmtDetailVal(v)}</span></div>`;
    const itemRows = (row.items || []).map((it, i) => `<tr>
        <td class="pr-seq">${i + 1}</td>
        <td>${fmtDetailVal(it.productName)}</td><td>${fmtDetailVal(it.specification)}</td><td>${fmtDetailVal(it.processName)}</td>
        <td>${fmtDetailVal(it.quantity)}</td><td>${fmtDetailVal(it.totalWeight)}</td><td>${fmtDetailVal(it.boxCount)}</td><td>${fmtDetailVal(it.remarks)}</td>
    </tr>`).join('');
    const html = `<div class="modal-overlay" onclick="if(event.target===this)closeModalDirect()">
        <div class="modal pr-editor-box inv-print-box" onclick="event.stopPropagation()">
            <div class="modal-header"><span class="modal-title">打印预览</span><span class="modal-close" onclick="closeModalDirect()">×</span></div>
            <div class="modal-body">
                <div class="qr-toolbar">
                    <span class="inv-print-hint">以下为送货单打印效果</span>
                    <span><button class="btn btn-primary" onclick="showMsg('演示环境：已触发打印')">🖨 打印</button></span>
                </div>
                <div class="qr-paper">
                    <div class="qr-head">
                        <div class="qr-logo">涂装MES系统</div>
                        <div class="qr-title">销售出库单</div>
                        <div class="qr-sub">SALES OUTBOUND ORDER</div>
                    </div>
                    <div class="qr-meta"><span>单号：${row.orderNo}</span><span>出库日期：${row.outboundDate}</span><span>打印时间：${nowDateTimeStr()}</span></div>
                    <div class="qr-section-title">一、收货信息</div>
                    <div class="qr-info-grid">
                        ${infoRow('收货单位', row.partnerName)}
                        ${infoRow('操作员', row.operatorName)}
                        ${infoRow('创建时间', row.createTime)}
                        ${infoRow('备注', row.remarks)}
                    </div>
                    <div class="qr-section-title">二、出库明细</div>
                    <table class="qr-table">
                        <thead><tr><th style="width:44px;">序号</th><th>产品</th><th>规格</th><th style="width:70px;">工序</th><th style="width:80px;">送货数</th><th style="width:80px;">总重(kg)</th><th style="width:60px;">箱数</th><th>备注</th></tr></thead>
                        <tbody>${itemRows || `<tr><td colspan="8" class="table-empty">无明细</td></tr>`}</tbody>
                        <tfoot><tr class="inv-print-total"><td colspan="4">合计</td><td>${sum('quantity')}</td><td>${sum('totalWeight')}</td><td>${sum('boxCount')}</td><td></td></tr></tfoot>
                    </table>
                    <div class="qr-sign">
                        <div class="qr-sign-item"><span>制单人：${row.operatorName || '-'}</span></div>
                        <div class="qr-sign-item"><span>仓管员：________</span></div>
                        <div class="qr-sign-item"><span>收货人：________</span></div>
                        <div class="qr-sign-item"><span>司机：________</span></div>
                    </div>
                </div>
            </div>
            <div class="modal-footer"><button class="btn" onclick="closeModalDirect()">关闭</button></div>
        </div>
    </div>`;
    document.getElementById('modalContainer').innerHTML = html;
}

// ---- 库存单据删除（库存自动回退） ----
function invDocDelete(idx) {
    const page = currentPage;
    const row = getEqRow(page, idx);
    if (!row) return;
    const docNo = row.sn || row.orderNo;
    showDeleteConfirm({
        desc: `确认删除单据「${docNo}」吗？删除后相关库存将自动回退，且不可恢复。`,
        onConfirm: function() {
            const isIn = page === 'inv-in-list';
            (row.items || []).forEach(it => {
                const code = it.productCode || invProductCodeByName(it.productName);
                if (!code) return;
                invApplyChange(code, isIn ? -Number(it.quantity) : Number(it.quantity), `删除单据 ${docNo} 库存回退`, 'admin');
            });
            const config = PAGE_CONFIG[page];
            const realIdx = config.data.indexOf(row);
            if (realIdx > -1) config.data.splice(realIdx, 1);
            window._filteredData = null;
            showMsg('删除成功，库存已回退');
            rerenderCurrentTable();
        }
    });
}

// ---- 库存预警页（实时联动 + 预置历史混合） ----
function invAlertData() {
    const stock = PAGE_CONFIG['inv-stock'].data;
    const dynamic = [];
    stock.forEach(r => {
        if (r.alertMin && Number(r.quantity) < Number(r.alertMin)) {
            dynamic.push({ productCode: r.productCode, productName: r.productName, warehouseName: r.warehouse || '-', alertType: '库存不足', currentStock: r.quantity, alertThreshold: r.alertMin, alertTime: nowDateTimeStr(), live: true });
        } else if (r.alertMax && Number(r.quantity) > Number(r.alertMax)) {
            dynamic.push({ productCode: r.productCode, productName: r.productName, warehouseName: r.warehouse || '-', alertType: '库存过量', currentStock: r.quantity, alertThreshold: r.alertMax, alertTime: nowDateTimeStr(), live: true });
        }
    });
    return dynamic.concat(INV_ALERT_PRESET);
}
function renderInvAlertPage() {
    const all = invAlertData();
    const flt = window._invAlertFilter || { kw: '', type: '全部' };
    const rows = all.filter(a => {
        if (flt.kw && !`${a.productCode} ${a.productName}`.toLowerCase().includes(flt.kw.toLowerCase())) return false;
        if (flt.type && flt.type !== '全部' && a.alertType !== flt.type) return false;
        return true;
    });
    const low = all.filter(a => a.alertType === '库存不足').length;
    const high = all.length - low;
    let html = qcStatCards([
        { label: '预警总数', value: all.length },
        { label: '库存不足', value: low, cls: 'qr-bad' },
        { label: '库存过量', value: high, cls: 'inv-num-warn' },
        { label: '监控产品数', value: PAGE_CONFIG['inv-stock'].data.length },
    ]);
    html += `<div class="search-bar">
        <div class="search-item"><span class="search-label">关键字</span><input type="text" class="search-input" id="inv-alert-kw" placeholder="请输入产品名称或编码搜索" value="${prEsc(flt.kw || '')}" onkeydown="if(event.key==='Enter')invAlertSearch()"></div>
        <div class="search-item"><span class="search-label">预警类型</span><select class="search-select" id="inv-alert-type">${['全部', '库存不足', '库存过量'].map(t => `<option value="${t}" ${flt.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
        <div class="search-item"><button class="btn btn-primary" onclick="invAlertSearch()">搜索</button></div>
        <div class="search-item"><button class="btn" onclick="invAlertReset()">重置</button></div>
    </div>
    <div class="toolbar"><button class="btn" onclick="navigateTo('inv-alert','库存预警')">刷新</button></div>
    <div class="table-wrapper"><table><thead><tr>
        <th style="min-width:120px;">产品编码</th><th>产品名称</th><th style="min-width:100px;">仓库</th><th style="min-width:100px;">预警类型</th><th style="min-width:100px;">当前库存</th><th style="min-width:100px;">预警阈值</th><th style="min-width:170px;">预警时间</th>
    </tr></thead><tbody>`;
    if (rows.length) {
        rows.forEach(a => {
            html += `<tr>
                <td>${a.productCode}</td><td>${a.productName}</td><td>${a.warehouseName}</td>
                <td><span class="tag ${a.alertType === '库存不足' ? 'tag-danger' : 'tag-warning'}">${a.alertType}</span></td>
                <td class="${a.alertType === '库存不足' ? 'inv-num-neg' : 'inv-num-warn'}" style="font-weight:600;">${a.currentStock}</td>
                <td>${a.alertThreshold}</td>
                <td>${a.alertTime}${a.live ? ' <span class="tag tag-info">实时</span>' : ''}</td>
            </tr>`;
        });
    } else {
        html += `<tr><td colspan="7" class="table-empty">暂无预警记录</td></tr>`;
    }
    html += `</tbody></table>${rows.length ? renderPagination(rows.length) : ''}</div>`;
    return html;
}
function invAlertSearch() {
    const kwEl = document.getElementById('inv-alert-kw');
    const typeEl = document.getElementById('inv-alert-type');
    window._invAlertFilter = { kw: kwEl ? kwEl.value : '', type: typeEl ? typeEl.value : '全部' };
    document.getElementById('content').innerHTML = renderInvAlertPage();
}
function invAlertReset() {
    window._invAlertFilter = null;
    document.getElementById('content').innerHTML = renderInvAlertPage();
}

// ============================================================
// 能耗管理模块（对齐真实系统：能耗记录/费用设置/初始能耗）
// 计算规则：当天使用量 = 抄表读数 - 上期读数（同类型按使用日期排序，首条上期=初始能耗）
//          当天费用 = 当天使用量 × 单价（费用设置的单价实时生效）
// ============================================================

// 单价格式化（最多两位小数，去掉多余的0）
function enFmtNum(v) {
    return Math.round((Number(v) || 0) * 100) / 100;
}

// 全量重算能耗记录的使用量与费用（新增/编辑/删除/单价或初始读数调整后调用）
function enRecalc() {
    const data = PAGE_CONFIG['energy-record'].data;
    ENERGY_TYPES.forEach(type => {
        const rows = data.filter(r => r.type === type)
            .sort((a, b) => String(a.usageDate) < String(b.usageDate) ? -1 : 1);
        let prev = Number(ENERGY_INITIAL[type]) || 0;
        rows.forEach(r => {
            const reading = Number(r.meterReading) || 0;
            const usage = reading - prev;
            r.usage = usage;
            r.cost = enFmtNum(usage * (Number(ENERGY_PRICES[type]) || 0));
            prev = reading;
        });
    });
}

// 某类型上一期读数：使用日期早于所选日期的最近一条记录的读数；无则初始能耗
function enPrevReading(type, usageDate, excludeId) {
    const rows = PAGE_CONFIG['energy-record'].data
        .filter(r => r.type === type && r.id !== excludeId && (!usageDate || String(r.usageDate) < String(usageDate)))
        .sort((a, b) => String(a.usageDate) < String(b.usageDate) ? 1 : -1);
    if (rows.length) return Number(rows[0].meterReading) || 0;
    return Number(ENERGY_INITIAL[type]) || 0;
}

// ---- 能耗记录：新增（跳转独立编辑页） ----
function enAdd() {
    window._enEditId = null;
    window._enForm = { type: '电', usageDate: invTodayStr(), meterReading: '', remark: '' };
    navigateTo('energy-edit', '添加能耗记录');
}

// ---- 能耗记录：编辑（跳转独立编辑页） ----
function enEditRow(idx) {
    const row = getEqRow('energy-record', idx);
    if (!row) return;
    window._enEditId = row.id;
    window._enForm = { type: row.type, usageDate: row.usageDate, meterReading: row.meterReading, remark: row.remark || '' };
    navigateTo('energy-edit', '编辑能耗记录');
}

// ---- 能耗记录：返回列表 ----
function enBack() {
    window._enForm = null;
    window._enEditId = null;
    navigateTo('energy-record', '能耗记录');
}

// ---- 能耗记录编辑页 ----
function renderEnergyEditPage() {
    const f = window._enForm || { type: '电', usageDate: invTodayStr(), meterReading: '', remark: '' };
    const isEdit = window._enEditId !== null && window._enEditId !== undefined;
    const title = isEdit ? '编辑能耗记录' : '添加能耗记录';
    const dtVal = f.usageDate ? String(f.usageDate).slice(0, 10) : '';
    let html = `<div class="detail-topbar">
        <button class="back-icon" onclick="enBack()" title="返回">‹</button>
        <span class="detail-title">${title}</span>
        <span class="detail-actions">
            <button class="btn" onclick="enBack()">返回</button>
            <button class="btn btn-primary" onclick="enSave()">保存</button>
        </span>
    </div>
    <div class="card"><div class="card-header"><span class="card-title">基本信息</span></div><div class="card-body">
        <div class="form-row">
            <div class="form-item"><label><span class="required">*</span>能耗类型</label>
                <select class="form-select" id="en-type" onchange="enCalcRefresh()">${ENERGY_TYPES.map(t => `<option value="${t}" ${f.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
            </div>
            <div class="form-item"><label><span class="required">*</span>使用日期</label>
                <input type="date" class="form-input" id="en-date" value="${dtVal}" onchange="enCalcRefresh()" />
            </div>
            <div class="form-item"><label><span class="required">*</span>抄表读数</label>
                <input type="number" class="form-input" id="en-reading" placeholder="请输入本次抄表读数" value="${f.meterReading}" oninput="enCalcRefresh()" />
            </div>
        </div>
        <div class="form-row">
            <div class="form-item" style="width:100%;"><label>备注</label>
                <textarea class="form-textarea" id="en-remark" placeholder="请输入备注">${prEsc(f.remark || '')}</textarea>
            </div>
        </div>
    </div></div>
    <div class="card"><div class="card-header"><span class="card-title">自动计算</span><span class="en-calc-tip">当天使用量 = 抄表读数 - 上期读数；当天费用 = 当天使用量 × 单价</span></div><div class="card-body">
        <div class="en-calc-grid">
            <div class="en-calc-item"><span class="en-calc-label">上期读数</span><span class="en-calc-value" id="en-prev">-</span></div>
            <div class="en-calc-item"><span class="en-calc-label">当天使用量</span><span class="en-calc-value en-calc-usage" id="en-usage">-</span></div>
            <div class="en-calc-item"><span class="en-calc-label">单价(元)</span><span class="en-calc-value" id="en-price">-</span></div>
            <div class="en-calc-item"><span class="en-calc-item-cost"><span class="en-calc-label">当天费用(元)</span><span class="en-calc-value en-calc-cost" id="en-cost">-</span></div>
        </div>
    </div></div>`;
    return html;
}

// 编辑页实时联动计算（类型/日期/读数任一变化时刷新）
function enCalcRefresh() {
    const typeEl = document.getElementById('en-type');
    const dateEl = document.getElementById('en-date');
    const readEl = document.getElementById('en-reading');
    if (!typeEl || !dateEl || !readEl) return;
    const type = typeEl.value;
    const date = dateEl.value;
    const reading = readEl.value === '' ? null : Number(readEl.value);
    const prev = enPrevReading(type, date, window._enEditId);
    const price = Number(ENERGY_PRICES[type]) || 0;
    const prevEl = document.getElementById('en-prev');
    const usageEl = document.getElementById('en-usage');
    const priceEl = document.getElementById('en-price');
    const costEl = document.getElementById('en-cost');
    if (prevEl) prevEl.textContent = prev.toLocaleString('zh-CN');
    if (priceEl) priceEl.textContent = price;
    if (reading === null) {
        if (usageEl) usageEl.textContent = '-';
        if (costEl) costEl.textContent = '-';
        return;
    }
    const usage = reading - prev;
    const cost = enFmtNum(usage * price);
    if (usageEl) {
        usageEl.textContent = usage.toLocaleString('zh-CN');
        usageEl.classList.toggle('en-neg', usage < 0);
    }
    if (costEl) {
        costEl.textContent = cost.toLocaleString('zh-CN');
        costEl.classList.toggle('en-neg', cost < 0);
    }
}

// ---- 能耗记录：保存 ----
function enSave() {
    const typeEl = document.getElementById('en-type');
    const dateEl = document.getElementById('en-date');
    const readEl = document.getElementById('en-reading');
    const remarkEl = document.getElementById('en-remark');
    if (!typeEl || !dateEl || !readEl) return;
    const type = typeEl.value;
    const usageDate = dateEl.value;
    const readingStr = readEl.value.trim();
    if (!usageDate) { showMsg('请选择使用日期', 'error'); dateEl.focus(); return; }
    if (readingStr === '') { showMsg('请输入抄表读数', 'error'); readEl.focus(); return; }
    const reading = Number(readingStr);
    if (isNaN(reading)) { showMsg('抄表读数必须为数字', 'error'); readEl.focus(); return; }
    const prev = enPrevReading(type, usageDate, window._enEditId);
    if (reading < prev) {
        showMsg(`抄表读数不能小于上期读数（${prev.toLocaleString('zh-CN')}）`, 'error');
        readEl.focus();
        return;
    }
    const remark = remarkEl ? remarkEl.value.trim() : '';
    const data = PAGE_CONFIG['energy-record'].data;
    if (window._enEditId !== null && window._enEditId !== undefined) {
        const row = data.find(r => r.id === window._enEditId);
        if (row) {
            row.type = type;
            row.usageDate = usageDate;
            row.meterReading = reading;
            row.remark = remark;
            row.createTime = nowDateTimeStr();
        }
    } else {
        const maxId = data.reduce((m, r) => Math.max(m, r.id || 0), 0);
        data.unshift({ id: maxId + 1, type, usageDate, meterReading: reading, remark, createTime: nowDateTimeStr(), createrName: 'admin' });
    }
    enRecalc();
    window._enForm = null;
    window._enEditId = null;
    showMsg('保存成功，使用量与费用已自动计算');
    navigateTo('energy-record', '能耗记录');
}

// ---- 能耗记录：查看详情弹窗 ----
function enView(idx) {
    const row = getEqRow('energy-record', idx);
    if (!row) return;
    const rows = [
        ['能耗类型', row.type], ['使用日期', row.usageDate], ['抄表读数', row.meterReading],
        ['当天使用量', row.usage], ['当天费用(元)', row.cost], ['备注', row.remark],
        ['创建时间', row.createTime], ['创建人', row.createrName],
    ].map(([l, v]) => `<tr><td class="wb2-cf-l">${l}</td><td>${fmtDetailVal(v)}</td></tr>`).join('');
    const html = `<div class="modal-overlay" onclick="if(event.target===this)closeModalDirect()">
        <div class="modal wb2-cf-box" onclick="event.stopPropagation()">
            <div class="modal-header"><span class="modal-title">能耗记录详情</span><span class="modal-close" onclick="closeModalDirect()">×</span></div>
            <div class="modal-body"><table class="wb2-cf-table"><tbody>${rows}</tbody></table></div>
            <div class="modal-footer"><button class="btn btn-primary" onclick="closeModalDirect()">关闭</button></div>
        </div>
    </div>`;
    document.getElementById('modalContainer').innerHTML = html;
}

// ---- 能耗记录：删除（删除后全量重算） ----
function enDelete(idx) {
    const row = getEqRow('energy-record', idx);
    if (!row) return;
    showDeleteConfirm({
        title: '确认删除吗',
        desc: `确认删除 ${row.usageDate} 的${row.type}能耗记录吗？删除后使用量将重新计算。`,
        onConfirm: function() {
            const data = PAGE_CONFIG['energy-record'].data;
            const realIdx = data.indexOf(row);
            if (realIdx > -1) data.splice(realIdx, 1);
            window._filteredData = null;
            enRecalc();
            showMsg('删除成功，使用量已重新计算');
            rerenderCurrentTable();
        }
    });
}

// ---- 费用设置页 ----
function enPriceUnit(type) {
    return type === '水' ? '元/吨' : type === '电' ? '元/度' : '元/m³';
}
function enPriceIcon(type) {
    return type === '水' ? '💧' : type === '电' ? '⚡' : '🔥';
}
function renderEnergyPricePage() {
    let html = `<div class="detail-topbar">
        <span class="detail-title">费用设置</span>
        <span class="detail-actions">
            <button class="btn" onclick="navigateTo('energy-price','费用设置')">重置</button>
            <button class="btn btn-primary" onclick="enPriceSave()">保存</button>
        </span>
    </div>
    <div class="card"><div class="card-header"><span class="card-title">能耗单价设置</span></div><div class="card-body">
        <div class="en-price-list">
            ${ENERGY_TYPES.map(t => `<div class="en-price-item">
                <div class="en-price-icon">${enPriceIcon(t)}</div>
                <div class="en-price-info"><div class="en-price-name">${t}</div><div class="en-price-unit">${enPriceUnit(t)}</div></div>
                <input type="number" step="0.01" min="0" class="form-input en-price-input" id="en-price-${t}" value="${ENERGY_PRICES[t]}" />
            </div>`).join('')}
        </div>
        <div class="en-tip">提示：单价保存后，能耗记录中的「当天费用」将按新单价自动重新计算。</div>
    </div></div>`;
    return html;
}
function enPriceSave() {
    for (const t of ENERGY_TYPES) {
        const el = document.getElementById('en-price-' + t);
        if (!el) continue;
        const v = Number(el.value);
        if (el.value.trim() === '' || isNaN(v) || v < 0) {
            showMsg(`请输入${t}的有效单价（≥0）`, 'error');
            el.focus();
            return;
        }
        ENERGY_PRICES[t] = enFmtNum(v);
    }
    enRecalc();
    showMsg('保存成功，能耗记录的当天费用已按新单价重新计算');
    navigateTo('energy-price', '费用设置');
}

// ---- 初始能耗页 ----
function renderEnergyInitialPage() {
    let html = `<div class="detail-topbar">
        <span class="detail-title">初始能耗</span>
        <span class="detail-actions">
            <button class="btn" onclick="navigateTo('energy-initial','初始能耗')">重置</button>
            <button class="btn btn-primary" onclick="enInitialSave()">保存</button>
        </span>
    </div>
    <div class="card"><div class="card-header"><span class="card-title">初始表读数设置</span></div><div class="card-body">
        <div class="en-price-list">
            ${ENERGY_TYPES.map(t => `<div class="en-price-item">
                <div class="en-price-icon">${enPriceIcon(t)}</div>
                <div class="en-price-info"><div class="en-price-name">${t}</div><div class="en-price-unit">初始表读数</div></div>
                <input type="number" min="0" class="form-input en-price-input" id="en-initial-${t}" value="${ENERGY_INITIAL[t]}" />
            </div>`).join('')}
        </div>
        <div class="en-tip">提示：初始读数作为该类型首条能耗记录使用量计算的基准（首条当天使用量 = 抄表读数 - 初始读数）。保存后使用量将重新计算。</div>
    </div></div>`;
    return html;
}
function enInitialSave() {
    for (const t of ENERGY_TYPES) {
        const el = document.getElementById('en-initial-' + t);
        if (!el) continue;
        const v = Number(el.value);
        if (el.value.trim() === '' || isNaN(v) || v < 0) {
            showMsg(`请输入${t}的有效初始读数（≥0）`, 'error');
            el.focus();
            return;
        }
        ENERGY_INITIAL[t] = v;
    }
    enRecalc();
    showMsg('保存成功，能耗记录的使用量已按新基准重新计算');
    navigateTo('energy-initial', '初始能耗');
}

// ============================================================
// 数据采集模块（对齐真实系统：数据分组/数据管理/数据记录/加料记录）
// 数据分组 → 数据管理（分组选项联动）；数据记录按上下限判定超标 → 联动数据管理最新值；
// 加料记录 = 数据记录按分组透视的矩阵表，支持导出打印预览
// ============================================================

// 编辑页保持来源菜单高亮
const DC_EDIT_FROM = { 'dc-batch': 'dc-record', 'dc-view': 'dc-record', 'dc-chart': 'dc-standard' };

// 所有分组名称（数据分组页实时数据）
function dcGroupNames() {
    return PAGE_CONFIG['dc-group'].data.map(g => g.name);
}

// 按上下限判定采集值状态
function dcJudgeStatus(value, lower, upper) {
    const v = Number(value);
    const lo = Number(lower), up = Number(upper);
    if (isNaN(v)) return { ok: false, status: '-' };
    if (!isNaN(lo) && v < lo) return { ok: true, status: '低于下限' };
    if (!isNaN(up) && v > up) return { ok: true, status: '超上限' };
    return { ok: true, status: '正常' };
}

// 状态 → tag 样式
function dcStatusTag(status) {
    if (status === '正常') return '<span class="tag tag-success">正常</span>';
    if (status === '低于下限') return '<span class="tag tag-warning">低于下限</span>';
    if (status === '超上限') return '<span class="tag tag-danger">超上限</span>';
    if (status === '有超标') return '<span class="tag tag-danger">有超标</span>';
    return '<span class="c-cell-muted">-</span>';
}

// ---- 数据分组：删除（分组被数据管理引用时禁止删除） ----
function dcGroupDelete(idx) {
    const row = getEqRow('dc-group', idx);
    if (!row) return;
    const used = PAGE_CONFIG['dc-standard'].data.filter(s => s.groupName === row.name);
    if (used.length > 0) {
        showDeleteConfirm({
            title: '无法删除',
            desc: `分组「${row.name}」下存在 ${used.length} 个数据名称（${used.slice(0, 3).map(u => u.name).join('、')}${used.length > 3 ? '等' : ''}），请先删除或转移该分组下的数据名称。`,
            confirmText: '知道了',
            onConfirm: function() {}
        });
        return;
    }
    showDeleteConfirm({
        title: '确认删除吗',
        desc: `确认删除分组「${row.name}」吗？删除后不可恢复。`,
        onConfirm: function() {
            const data = PAGE_CONFIG['dc-group'].data;
            const realIdx = data.indexOf(row);
            if (realIdx > -1) data.splice(realIdx, 1);
            window._filteredData = null;
            showMsg('删除成功');
            rerenderCurrentTable();
        }
    });
}

// ---- 数据管理：删除 ----
function dcStandardDelete(idx) {
    const row = getEqRow('dc-standard', idx);
    if (!row) return;
    showDeleteConfirm({
        title: '确认删除吗',
        desc: `确认删除数据名称「${row.name}」吗？历史数据记录中的该项保留为快照，不再参与新采集。`,
        onConfirm: function() {
            const data = PAGE_CONFIG['dc-standard'].data;
            const realIdx = data.indexOf(row);
            if (realIdx > -1) data.splice(realIdx, 1);
            window._filteredData = null;
            showMsg('删除成功');
            rerenderCurrentTable();
        }
    });
}

// ---- 数据管理：趋势图页 ----
function dcChartOpen(idx) {
    const row = getEqRow('dc-standard', idx);
    if (!row) return;
    window._dcChartId = row.id;
    navigateTo('dc-chart', '数据趋势');
}

// 提取某参数的全部历史采集点（按采集时间升序）
function dcHistoryPoints(name) {
    const points = [];
    PAGE_CONFIG['dc-record'].data.forEach(r => {
        (r.params || []).forEach(p => {
            if (p.name === name) points.push({ time: r.collectTime, value: Number(p.value), status: p.status });
        });
    });
    points.sort((a, b) => String(a.time) < String(b.time) ? -1 : 1);
    return points;
}

function renderDcChartPage() {
    const row = PAGE_CONFIG['dc-standard'].data.find(r => r.id === window._dcChartId);
    if (!row) {
        return `<div class="detail-topbar">
            <button class="back-icon" onclick="navigateTo('dc-standard','数据管理')" title="返回">‹</button>
            <span class="detail-title">数据趋势</span>
        </div><div class="card"><div class="card-body">参数不存在，请从数据管理列表进入。</div></div>`;
    }
    const points = dcHistoryPoints(row.name);
    const lower = Number(row.lower), upper = Number(row.upper);
    // 超标次数
    const abnormal = points.filter(p => p.status !== '正常').length;
    const avg = points.length ? enFmtNum(points.reduce((s, p) => s + p.value, 0) / points.length) : '-';

    // SVG 趋势图
    const W = 800, H = 340, padL = 64, padR = 28, padT = 28, padB = 60;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    let minV = points.length ? Math.min(lower, ...points.map(p => p.value)) : Math.min(lower, upper);
    let maxV = points.length ? Math.max(upper, ...points.map(p => p.value)) : Math.max(lower, upper);
    if (minV === maxV) { minV -= 1; maxV += 1; }
    const span = maxV - minV;
    minV -= span * 0.12; maxV += span * 0.12;
    const y = v => padT + plotH - (v - minV) / (maxV - minV) * plotH;
    const x = i => points.length <= 1 ? padL + plotW / 2 : padL + i / (points.length - 1) * plotW;

    let svg = `<svg viewBox="0 0 ${W} ${H}" class="dcc-svg" preserveAspectRatio="xMidYMid meet">`;
    // Y轴网格 + 刻度
    for (let i = 0; i <= 5; i++) {
        const v = minV + (maxV - minV) * (1 - i / 5);
        const gy = y(v);
        svg += `<line x1="${padL}" y1="${gy}" x2="${W - padR}" y2="${gy}" stroke="#e4e7ed" stroke-width="1"/>`;
        svg += `<text x="${padL - 8}" y="${gy + 4}" text-anchor="end" font-size="11" fill="#909399">${Math.round(v * 100) / 100}</text>`;
    }
    // 正常区间带（下限~上限）
    const bandTop = y(Math.min(upper, maxV));
    const bandBottom = y(Math.max(lower, minV));
    svg += `<rect x="${padL}" y="${bandTop}" width="${plotW}" height="${Math.max(0, bandBottom - bandTop)}" fill="#52c41a" fill-opacity="0.08"/>`;
    // 上下限虚线
    if (upper >= minV && upper <= maxV) {
        svg += `<line x1="${padL}" y1="${y(upper)}" x2="${W - padR}" y2="${y(upper)}" stroke="#ff4d4f" stroke-width="1" stroke-dasharray="6 4"/>`;
        svg += `<text x="${W - padR - 4}" y="${y(upper) - 5}" text-anchor="end" font-size="11" fill="#ff4d4f">上限 ${upper}${row.unit || ''}</text>`;
    }
    if (lower >= minV && lower <= maxV) {
        svg += `<line x1="${padL}" y1="${y(lower)}" x2="${W - padR}" y2="${y(lower)}" stroke="#faad14" stroke-width="1" stroke-dasharray="6 4"/>`;
        svg += `<text x="${W - padR - 4}" y="${y(lower) + 14}" text-anchor="end" font-size="11" fill="#faad14">下限 ${lower}${row.unit || ''}</text>`;
    }
    // X轴
    svg += `<line x1="${padL}" y1="${padT + plotH}" x2="${W - padR}" y2="${padT + plotH}" stroke="#dcdfe6" stroke-width="1"/>`;
    // X轴时间标签（最多显示7个）
    if (points.length) {
        const step = Math.max(1, Math.ceil(points.length / 7));
        points.forEach((p, i) => {
            if (i % step !== 0 && i !== points.length - 1) return;
            const lbl = String(p.time || '').slice(5, 16);
            svg += `<line x1="${x(i)}" y1="${padT + plotH}" x2="${x(i)}" y2="${padT + plotH + 4}" stroke="#dcdfe6"/>`;
            svg += `<text x="${x(i)}" y="${padT + plotH + 18}" text-anchor="end" font-size="10" fill="#909399" transform="rotate(-35 ${x(i)} ${padT + plotH + 18})">${lbl}</text>`;
        });
    }
    // 折线 + 数据点
    if (points.length) {
        const polyline = points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ');
        svg += `<polyline points="${polyline}" fill="none" stroke="#1890ff" stroke-width="2"/>`;
        points.forEach((p, i) => {
            const bad = p.status !== '正常';
            svg += `<circle cx="${x(i)}" cy="${y(p.value)}" r="${bad ? 5 : 4}" fill="${bad ? '#ff4d4f' : '#1890ff'}" stroke="#fff" stroke-width="1.5"/>`;
        });
    }
    svg += `</svg>`;
    if (!points.length) svg += `<div class="dcc-empty">暂无采集数据</div>`;

    const html = `<div class="detail-topbar">
        <button class="back-icon" onclick="navigateTo('dc-standard','数据管理')" title="返回">‹</button>
        <span class="detail-title">数据趋势</span>
        <span class="tag tag-info">${row.groupName}</span>
        <span class="detail-actions">
            <button class="btn" onclick="navigateTo('dc-standard','数据管理')">返回</button>
        </span>
    </div>
    ${qcStatCards([
        { label: '参数名称', value: row.name },
        { label: '采集次数', value: points.length },
        { label: '平均值', value: avg + (row.unit || '') },
        { label: '超标次数', value: abnormal, cls: abnormal > 0 ? 'qr-bad' : '' },
    ])}
    <div class="card">
        <div class="card-header"><span class="card-title">${row.name}（${row.unit || ''}）标准范围：${lower} ~ ${upper}${row.unit || ''}</span></div>
        <div class="card-body">
            <div class="dcc-chart-wrap">${svg}</div>
            <div class="dcc-legend">
                <span><i class="dcc-dot dcc-dot-normal"></i>正常点</span>
                <span><i class="dcc-dot dcc-dot-bad"></i>超标点</span>
                <span><i class="dcc-band"></i>正常区间</span>
            </div>
        </div>
    </div>`;
    return html;
}

// ---- 数据记录：最新值联动（保存/删除记录后刷新数据管理的最新值） ----
function dcRefreshLatest() {
    const records = PAGE_CONFIG['dc-record'].data;
    PAGE_CONFIG['dc-standard'].data.forEach(st => {
        let latest = null;
        records.forEach(r => {
            (r.params || []).forEach(p => {
                if (p.name === st.name) {
                    if (!latest || String(r.collectTime) > String(latest.time)) {
                        latest = { time: r.collectTime, value: p.value, status: p.status };
                    }
                }
            });
        });
        if (latest) {
            st.latestValue = latest.value;
            st.latestTime = latest.time;
            st.latestStatus = latest.status;
        } else {
            st.latestValue = undefined;
            st.latestTime = undefined;
            st.latestStatus = undefined;
        }
    });
}

// ---- 数据记录：批量采集（新增） ----
function dcBatchAdd() {
    window._dcEditId = null;
    window._dcForm = { collectTime: nowDateTimeStr(), group: '全部' };
    window._dcParams = PAGE_CONFIG['dc-standard'].data.map(st => ({
        stdId: st.id, name: st.name, groupName: st.groupName, unit: st.unit || '',
        lower: st.lower, upper: st.upper, checked: true, value: ''
    }));
    navigateTo('dc-batch', '批量采集');
}

// ---- 数据记录：编辑（预填已有采集值） ----
function dcEditRow(idx) {
    const row = getEqRow('dc-record', idx);
    if (!row) return;
    window._dcEditId = row.id;
    window._dcForm = { collectTime: row.collectTime, group: '全部' };
    const byName = {};
    (row.params || []).forEach(p => { byName[p.name] = p; });
    window._dcParams = PAGE_CONFIG['dc-standard'].data.map(st => {
        const existed = byName[st.name];
        return {
            stdId: st.id, name: st.name, groupName: st.groupName, unit: st.unit || '',
            lower: st.lower, upper: st.upper, checked: !!existed, value: existed ? existed.value : ''
        };
    });
    navigateTo('dc-batch', '编辑数据记录');
}
function dcEditById(id) {
    const idx = PAGE_CONFIG['dc-record'].data.findIndex(r => r.id === id);
    if (idx > -1) dcEditRow(idx);
}

// ---- 数据记录：查看详情页 ----
function dcViewRow(idx) {
    const row = getEqRow('dc-record', idx);
    if (!row) return;
    window._dcViewId = row.id;
    navigateTo('dc-view', '数据记录详情');
}

// ---- 批量采集/编辑页 ----
function renderDcBatchPage() {
    const f = window._dcForm || { collectTime: nowDateTimeStr(), group: '全部' };
    const params = window._dcParams || [];
    const isEdit = window._dcEditId !== null && window._dcEditId !== undefined;
    const title = isEdit ? '编辑数据记录' : '批量采集';
    const dtVal = f.collectTime ? String(f.collectTime).replace(' ', 'T').slice(0, 16) : '';
    const groups = ['全部'].concat(dcGroupNames());
    // 分组筛选只影响表格显示
    const showParams = params.filter(p => f.group === '全部' || p.groupName === f.group);
    const checkedCount = params.filter(p => p.checked).length;

    const rowsHtml = showParams.length ? showParams.map(p => {
        const gIdx = params.indexOf(p);
        const judged = p.value === '' || p.value === null || p.value === undefined ? null : dcJudgeStatus(p.value, p.lower, p.upper);
        return `<tr>
            <td style="text-align:center;"><input type="checkbox" class="checkbox" ${p.checked ? 'checked' : ''} onchange="dcParamCheck(${gIdx}, this.checked)" /></td>
            <td>${p.name}</td>
            <td>${p.groupName}</td>
            <td>${p.unit || '-'}</td>
            <td>${p.lower}</td>
            <td>${p.upper}</td>
            <td><input type="number" step="any" class="form-input dcb-value-input" value="${p.value}" placeholder="输入采集值" oninput="dcParamInput(${gIdx}, this.value)" /></td>
            <td id="dcb-status-${gIdx}">${judged ? dcStatusTag(judged.status) : '<span class="c-cell-muted">-</span>'}</td>
        </tr>`;
    }).join('') : `<tr><td colspan="8" class="table-empty">该分组下暂无数据名称</td></tr>`;

    const html = `<div class="detail-topbar">
        <button class="back-icon" onclick="dcBatchBack()" title="返回">‹</button>
        <span class="detail-title">${title}</span>
        <span class="detail-actions">
            <button class="btn" onclick="dcBatchBack()">返回</button>
            <button class="btn btn-primary" onclick="dcBatchSave()">保存</button>
        </span>
    </div>
    <div class="card"><div class="card-header"><span class="card-title">基本信息</span></div><div class="card-body">
        <div class="form-row">
            <div class="form-item"><label><span class="required">*</span>采集时间</label>
                <input type="datetime-local" class="form-input" id="dcb-time" value="${dtVal}" />
            </div>
            <div class="form-item"><label>分组筛选</label>
                <select class="form-select" id="dcb-group" onchange="dcBatchFilter()">${groups.map(g => `<option value="${g}" ${f.group === g ? 'selected' : ''}>${g}</option>`).join('')}</select>
            </div>
            <div class="form-item dcb-check-all">
                <label class="dcb-check-label"><input type="checkbox" class="checkbox" ${checkedCount === params.length && params.length ? 'checked' : ''} onchange="dcCheckAll(this.checked)" /> 全选参数</label>
                <span class="dcb-checked-tip">已选 ${checkedCount}/${params.length} 项</span>
            </div>
        </div>
    </div></div>
    <div class="card"><div class="card-header"><span class="card-title">采集参数明细</span><span class="en-calc-tip">仅勾选且填写采集值的参数会被保存；状态按上下限自动判定</span></div><div class="card-body">
        <div class="pr-steps-wrap"><table class="pr-steps-table" style="min-width:900px;">
            <thead><tr>
                <th style="width:48px;">选择</th><th style="width:150px;">名称</th><th style="width:110px;">所属分组</th>
                <th style="width:70px;">单位</th><th style="width:90px;">下限值</th><th style="width:90px;">上限值</th>
                <th style="width:150px;">采集值</th><th style="width:100px;">状态</th>
            </tr></thead>
            <tbody>${rowsHtml}</tbody>
        </table></div>
    </div></div>`;
    return html;
}

function dcBatchBack() {
    window._dcForm = null;
    window._dcEditId = null;
    window._dcParams = null;
    navigateTo('dc-record', '数据记录');
}

// 分组筛选（只影响显示，保留已填值与勾选状态）
function dcBatchFilter() {
    const el = document.getElementById('dcb-group');
    if (!el || !window._dcForm) return;
    window._dcForm.group = el.value;
    document.getElementById('content').innerHTML = renderDcBatchPage();
}

// 勾选参数
function dcParamCheck(i, checked) {
    const params = window._dcParams || [];
    if (params[i]) params[i].checked = !!checked;
}

// 全选/取消全选
function dcCheckAll(checked) {
    (window._dcParams || []).forEach(p => { p.checked = !!checked; });
    document.getElementById('content').innerHTML = renderDcBatchPage();
}

// 输入采集值：实时判定状态（越界变色提示）
function dcParamInput(i, val) {
    const params = window._dcParams || [];
    if (!params[i]) return;
    params[i].value = val;
    const stEl = document.getElementById('dcb-status-' + i);
    if (!stEl) return;
    if (val === '' || val === null || val === undefined) {
        stEl.innerHTML = '<span class="c-cell-muted">-</span>';
        return;
    }
    const judged = dcJudgeStatus(val, params[i].lower, params[i].upper);
    stEl.innerHTML = dcStatusTag(judged.status);
}

// 批量采集保存：写入数据记录 + 联动数据管理最新值
function dcBatchSave() {
    const timeEl = document.getElementById('dcb-time');
    if (!timeEl) return;
    const collectTime = timeEl.value ? timeEl.value.replace('T', ' ') + ':00' : '';
    if (!collectTime) { showMsg('请选择采集时间', 'error'); timeEl.focus(); return; }
    const params = (window._dcParams || []).filter(p => p.checked);
    if (!params.length) { showMsg('请至少勾选一个采集参数', 'error'); return; }
    // 校验勾选参数均已填写且为数字
    for (const p of params) {
        if (p.value === '' || p.value === null || p.value === undefined) {
            showMsg(`请填写「${p.name}」的采集值，或取消勾选`, 'error');
            return;
        }
        if (isNaN(Number(p.value))) {
            showMsg(`「${p.name}」的采集值必须为数字`, 'error');
            return;
        }
    }
    // 以数据管理当前定义的上下限为准生成参数快照
    const stdMap = {};
    PAGE_CONFIG['dc-standard'].data.forEach(s => { stdMap[s.name] = s; });
    const newParams = params.map(p => {
        const st = stdMap[p.name] || p;
        const judged = dcJudgeStatus(p.value, st.lower, st.upper);
        return {
            name: p.name, groupName: st.groupName, unit: st.unit || '',
            lower: st.lower, upper: st.upper, value: Number(p.value), status: judged.status
        };
    });
    const status = newParams.some(p => p.status !== '正常') ? '有超标' : '正常';
    const data = PAGE_CONFIG['dc-record'].data;
    if (window._dcEditId !== null && window._dcEditId !== undefined) {
        const row = data.find(r => r.id === window._dcEditId);
        if (row) {
            row.collectTime = collectTime;
            row.params = newParams;
            row.paramCount = newParams.length;
            row.status = status;
            row.createTime = nowDateTimeStr();
        }
    } else {
        const maxId = data.reduce((m, r) => Math.max(m, r.id || 0), 0);
        data.unshift({ id: maxId + 1, collectTime, params: newParams, paramCount: newParams.length, status, createTime: nowDateTimeStr() });
    }
    // 联动数据管理最新值/最新时间/最新状态
    dcRefreshLatest();
    window._dcForm = null;
    window._dcEditId = null;
    window._dcParams = null;
    showMsg(status === '有超标' ? '保存成功：本次采集存在超标项，数据管理最新值已更新' : '保存成功，数据管理最新值已更新');
    navigateTo('dc-record', '数据记录');
}

// ---- 数据记录详情页 ----
function renderDcViewPage() {
    const row = PAGE_CONFIG['dc-record'].data.find(r => r.id === window._dcViewId);
    if (!row) {
        return `<div class="detail-topbar">
            <button class="back-icon" onclick="navigateTo('dc-record','数据记录')" title="返回">‹</button>
            <span class="detail-title">数据记录详情</span>
        </div><div class="card"><div class="card-body">记录不存在。</div></div>`;
    }
    const params = row.params || [];
    const itemRows = params.map((p, i) => `<tr>
        <td class="pr-seq">${i + 1}</td>
        <td>${p.name}</td><td>${p.groupName || '-'}</td><td>${p.unit || '-'}</td>
        <td>${p.lower}</td><td>${p.upper}</td>
        <td class="${p.status !== '正常' ? 'dcb-value-bad' : ''}" style="font-weight:600;">${p.value}</td>
        <td>${dcStatusTag(p.status)}</td>
    </tr>`).join('');
    const html = `<div class="detail-topbar">
        <button class="back-icon" onclick="navigateTo('dc-record','数据记录')" title="返回">‹</button>
        <span class="detail-title">数据记录详情</span>
        ${dcStatusTag(row.status)}
        <span class="detail-actions">
            <button class="btn" onclick="navigateTo('dc-record','数据记录')">返回</button>
            <button class="btn btn-primary" onclick="dcEditById(${row.id})">编辑</button>
        </span>
    </div>
    <div class="card"><div class="card-header"><span class="card-title">基本信息</span></div><div class="card-body">
        <div class="dcc-info-grid">
            <div class="dcc-info-item"><span class="dcc-info-label">采集时间</span><span>${row.collectTime}</span></div>
            <div class="dcc-info-item"><span class="dcc-info-label">参数数量</span><span>${row.paramCount}</span></div>
            <div class="dcc-info-item"><span class="dcc-info-label">采集参数</span><span>${params.map(p => p.name).join('、')}</span></div>
            <div class="dcc-info-item"><span class="dcc-info-label">状态</span><span>${dcStatusTag(row.status)}</span></div>
            <div class="dcc-info-item"><span class="dcc-info-label">创建时间</span><span>${row.createTime}</span></div>
        </div>
    </div></div>
    <div class="card"><div class="card-header"><span class="card-title">采集参数明细</span></div><div class="card-body">
        <div class="pr-steps-wrap"><table class="pr-steps-table" style="min-width:760px;">
            <thead><tr>
                <th style="width:44px;">#</th><th>名称</th><th style="width:110px;">所属分组</th>
                <th style="width:70px;">单位</th><th style="width:90px;">下限值</th><th style="width:90px;">上限值</th>
                <th style="width:90px;">采集值</th><th style="width:90px;">状态</th>
            </tr></thead>
            <tbody>${itemRows || '<tr><td colspan="8" class="table-empty">暂无参数</td></tr>'}</tbody>
        </table></div>
    </div></div>`;
    return html;
}

// ---- 数据记录：删除（删除后联动最新值） ----
function dcRecordDelete(idx) {
    const row = getEqRow('dc-record', idx);
    if (!row) return;
    showDeleteConfirm({
        title: '确认删除吗',
        desc: `确认删除 ${row.collectTime} 的数据记录吗？删除后数据管理的最新值将重新计算。`,
        onConfirm: function() {
            const data = PAGE_CONFIG['dc-record'].data;
            const realIdx = data.indexOf(row);
            if (realIdx > -1) data.splice(realIdx, 1);
            window._filteredData = null;
            dcRefreshLatest();
            showMsg('删除成功，最新值已重新计算');
            rerenderCurrentTable();
        }
    });
}

// ---- 加料记录：按分组透视数据记录生成矩阵 ----
function dcFeedingMatrix() {
    const flt = window._dcFeedingFilter || { group: DC_FEEDING_GROUPS[0] || '全部', startDate: '', endDate: '' };
    // 时间范围内的记录（升序）
    const records = PAGE_CONFIG['dc-record'].data.filter(r => {
        const day = (r.collectTime || '').slice(0, 10);
        if (flt.startDate && day < flt.startDate) return false;
        if (flt.endDate && day > flt.endDate) return false;
        return true;
    }).sort((a, b) => String(a.collectTime) < String(b.collectTime) ? -1 : 1);
    // 行：所选分组下的数据名称
    const stds = PAGE_CONFIG['dc-standard'].data.filter(s => s.groupName === flt.group);
    const times = records.map(r => r.collectTime);
    const matrix = stds.map(st => {
        const cells = records.map(r => {
            const p = (r.params || []).find(p => p.name === st.name);
            return p ? { value: p.value, status: p.status } : null;
        });
        return { st, cells };
    });
    return { flt, records, times, matrix };
}

function renderDcFeedingPage() {
    const { flt, records, times, matrix } = dcFeedingMatrix();
    const groupOptions = Array.from(new Set(dcGroupNames().concat(DC_FEEDING_GROUPS)));
    // 签字人按记录序号轮换
    const signers = records.map((r, i) => DC_FEEDING_SIGNERS[i % DC_FEEDING_SIGNERS.length]);
    const abnormalCount = records.filter(r => r.status === '有超标').length;

    // 矩阵表
    const headCells = times.map(t => `<th class="dcf-time-th">${String(t).slice(5, 16)}</th>`).join('');
    const bodyRows = matrix.length ? matrix.map(m => `<tr>
        <td class="dcf-param">${m.st.name}</td>
        <td class="dcf-unit">${m.st.unit || '-'}</td>
        <td class="dcf-range">${m.st.lower}~${m.st.upper}</td>
        ${m.cells.map(c => c
            ? `<td class="${c.status !== '正常' ? 'dcf-cell-bad' : ''}">${c.value}</td>`
            : '<td class="dcf-cell-empty">-</td>').join('')}
    </tr>`).join('') : `<tr><td colspan="${times.length + 3 || 1}" class="table-empty">该分组下暂无数据名称</td></tr>`;

    const html = `${qcStatCards([
        { label: '采集记录数', value: records.length },
        { label: '采集参数数', value: matrix.length },
        { label: '超标记录数', value: abnormalCount, cls: abnormalCount > 0 ? 'qr-bad' : '' },
        { label: '签字轮换', value: DC_FEEDING_SIGNERS.length + ' 人' },
    ])}
    <div class="search-bar">
        <div class="search-item"><span class="search-label">加料分组</span>
            <select class="search-select" id="dcf-group">${groupOptions.map(g => `<option value="${g}" ${flt.group === g ? 'selected' : ''}>${g}</option>`).join('')}</select>
        </div>
        <div class="search-item"><span class="search-label">开始日期</span><input type="date" class="search-input" id="dcf-start" value="${flt.startDate || ''}" /></div>
        <div class="search-item"><span class="search-label">结束日期</span><input type="date" class="search-input" id="dcf-end" value="${flt.endDate || ''}" /></div>
        <div class="search-item"><button class="btn btn-primary" onclick="dcFeedingSearch()">搜索</button></div>
        <div class="search-item"><button class="btn" onclick="dcFeedingReset()">重置</button></div>
    </div>
    <div class="toolbar">
        <button class="btn" onclick="navigateTo('dc-feeding','加料记录')">刷新</button>
        <button class="btn btn-primary" onclick="dcFeedingExport()">导出打印</button>
    </div>
    <div class="card">
        <div class="card-header"><span class="card-title">加料记录表（${flt.group}）</span><span class="en-calc-tip">由数据记录按分组自动透视生成，红色为超标值</span></div>
        <div class="card-body">
            <div class="dcf-table-wrap"><table class="dcf-table" style="min-width:${times.length * 92 + 260}px;">
                <thead><tr>
                    <th class="dcf-param-th">参数名称</th><th style="width:64px;">单位</th><th style="width:110px;">标准范围</th>
                    ${headCells || ''}
                </tr></thead>
                <tbody>${bodyRows}</tbody>
            </table></div>
            ${times.length ? `<div class="dcf-sign-bar">
                <span>制表人：<b>admin</b></span>
                <span>记录人：<b>${[...new Set(signers)].join('、')}</b></span>
                <span>审核人：<b>${DC_FEEDING_SIGNERS[(records.length + 1) % DC_FEEDING_SIGNERS.length]}</b></span>
                <span>制表日期：<b>${invTodayStr()}</b></span>
            </div>` : `<div class="dcf-sign-bar"><span class="c-cell-muted">所选日期范围内暂无采集记录</span></div>`}
        </div>
    </div>`;
    return html;
}

function dcFeedingSearch() {
    const g = document.getElementById('dcf-group');
    const s = document.getElementById('dcf-start');
    const e = document.getElementById('dcf-end');
    window._dcFeedingFilter = {
        group: g ? g.value : DC_FEEDING_GROUPS[0],
        startDate: s ? s.value : '',
        endDate: e ? e.value : ''
    };
    document.getElementById('content').innerHTML = renderDcFeedingPage();
}

function dcFeedingReset() {
    window._dcFeedingFilter = null;
    document.getElementById('content').innerHTML = renderDcFeedingPage();
}

// ---- 加料记录：导出打印预览（新窗口） ----
function dcFeedingExport() {
    const { flt, records, times, matrix } = dcFeedingMatrix();
    const signers = records.map((r, i) => DC_FEEDING_SIGNERS[i % DC_FEEDING_SIGNERS.length]);
    const headCells = times.map(t => `<th>${String(t).slice(5, 16)}</th>`).join('');
    const bodyRows = matrix.length ? matrix.map(m => `<tr>
        <td class="param">${m.st.name}</td>
        <td>${m.st.unit || '-'}</td>
        <td>${m.st.lower}~${m.st.upper}</td>
        ${m.cells.map(c => c
            ? `<td class="${c.status !== '正常' ? 'bad' : ''}">${c.value}</td>`
            : '<td>-</td>').join('')}
    </tr>`).join('') : `<tr><td colspan="3">该分组下暂无数据名称</td></tr>`;

    const printHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>加料记录表（${flt.group}）</title>
<style>
    body { font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; font-size: 12px; color: #303133; padding: 24px; }
    h2 { text-align: center; font-size: 18px; margin-bottom: 4px; }
    .sub { text-align: center; color: #606266; margin-bottom: 16px; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 18px; }
    th, td { border: 1px solid #303133; padding: 5px 8px; text-align: center; }
    th { background: #f0f2f5; font-weight: 600; }
    td.param { text-align: left; font-weight: 600; }
    td.bad { color: #ff4d4f; font-weight: 700; }
    .sign { display: flex; justify-content: space-between; margin-top: 18px; font-size: 13px; }
    .meta { margin-bottom: 10px; color: #606266; font-size: 12px; }
    @media print { body { padding: 0; } }
</style></head>
<body>
    <h2>加料记录表（${flt.group}）</h2>
    <div class="sub">标准范围 = 下限~上限；红色为超标值</div>
    <div class="meta">统计范围：${flt.startDate || '最早'} ~ ${flt.endDate || '最新'}　采集记录数：${records.length}　打印时间：${nowDateTimeStr()}</div>
    <table>
        <thead><tr><th>参数名称</th><th>单位</th><th>标准范围</th>${headCells}</tr></thead>
        <tbody>${bodyRows}</tbody>
    </table>
    <div class="sign">
        <span>制表人：admin</span>
        <span>记录人：${[...new Set(signers)].join('、')}</span>
        <span>审核人：${DC_FEEDING_SIGNERS[(records.length + 1) % DC_FEEDING_SIGNERS.length]}</span>
        <span>制表日期：${invTodayStr()}</span>
    </div>
    <script>window.onload = function() { setTimeout(function() { window.print(); }, 300); };<\/script>
</body></html>`;
    const w = window.open('', '_blank');
    if (!w) { showMsg('浏览器拦截了打印窗口，请允许弹出窗口后重试', 'error'); return; }
    w.document.write(printHtml);
    w.document.close();
    w.focus();
}

// ============================================================
// 内置登录弹窗（演示系统：不做真实密码校验）
// 页面打开时：全屏黑色半透明遮罩 + 居中登录弹窗，MES 主界面隐藏；
// 点击【登录】关闭遮罩显示主界面；右上角【退出登录】重新调出弹窗。
// ============================================================
let isLoggedIn = false; // 登录状态：控制 MES 主界面显隐与图表初始化时机

// 打开登录弹窗：显示遮罩与弹窗，隐藏 MES 主界面
function showLogin() {
    isLoggedIn = false;
    const mask = document.getElementById('loginMask');
    const app = document.getElementById('app');
    if (mask) mask.style.display = 'flex';
    if (app) app.style.display = 'none';
}

// 点击【登录】按钮：关闭遮罩弹窗，显示完整 MES 主页面（无真实校验）
function doLogin() {
    isLoggedIn = true;
    const mask = document.getElementById('loginMask');
    const app = document.getElementById('app');
    if (mask) mask.style.display = 'none';
    if (app) app.style.display = 'flex';
    // 主界面由隐藏变为可见后重新渲染当前页，确保 ECharts 在可见容器中正确初始化
    navigateTo(currentPage, window._lastPageLabel || null);
    ecResizeAll();
}

// 右上角【退出登录】：释放图表实例并重新调出登录弹窗，隐藏 MES 主界面
function logout() {
    ecDisposeAll();
    showLogin();
}

// ============================================================
// 顶部模块 Tab 标签栏（位于面包屑/顶栏下方、仪表盘上方）
// Tab 列表读取系统已有二级模块；与左侧侧边栏双向联动；
// 点击 Tab 复用现有路由渲染对应模块真实页面，其余模块隐藏。
// ============================================================
const MODULE_TABS = [
    { page: 'dashboard-overview', label: '数据概览' },
    { page: 'dashboard-notice', label: '消息通知' },
    { page: 'product-list', label: '产品管理' },
    { page: 'product-type', label: '产品类型' },
    { page: 'customer', label: '客户管理' },
    { page: 'production-order', label: '生产订单' },
    { page: 'production-task', label: '生产任务' },
    { page: 'work-report', label: '报工记录' },
    { page: 'work-bench', label: '报工工作台' },
    { page: 'work-param', label: '报工参数' },
    { page: 'equipment-list', label: '设备列表' },
    { page: 'equipment-repair', label: '设备报修' },
    { page: 'work-process', label: '工序列表' },
    { page: 'work-process-type', label: '工序类型' },
    { page: 'maintenance-plan', label: '保养计划' },
    { page: 'inspection-plan', label: '点检计划' },
    { page: 'qc-plan', label: '质检方案' },
    { page: 'qc-trace', label: '产品信息追溯' },
    { page: 'qc-finished', label: '成品入库检' },
    { page: 'inv-stock', label: '库存查询' },
    { page: 'sys-employee', label: '员工管理' },
];

// 渲染顶部 Tab 栏（初始化时调用一次，标签不带关闭按钮）
function renderModuleTabs() {
    const wrap = document.getElementById('moduleTabs');
    if (!wrap) return;
    wrap.innerHTML = MODULE_TABS.map(t =>
        `<div class="module-tab" id="mtab-${t.page}" title="${t.label}" onclick="switchModuleTab('${t.page}', '${t.label}')">${t.label}</div>`
    ).join('');
}

// 点击顶部 Tab：切换显示对应模块内容（复用现有路由，其余模块隐藏）
function switchModuleTab(pageId, label) {
    navigateTo(pageId, label);
}

// 同步 Tab 高亮：侧边栏菜单与顶部 Tab 任一切换后自动选中对应标签
function updateModuleTabs(pageId) {
    document.querySelectorAll('.module-tab').forEach(el => el.classList.remove('active'));
    // 质检报告工作台保持来源模块（质量管理）Tab 高亮
    if (pageId === 'qc-report-edit' && window._qtForm && window._qtForm.from) pageId = window._qtForm.from;
    const tab = document.getElementById('mtab-' + pageId);
    if (tab) {
        tab.classList.add('active');
        // Tab 栏超宽可横向滚动，自动将选中项滚动到可视区域（兼容不支持该API的旧环境）
        if (typeof tab.scrollIntoView === 'function') {
            tab.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
        }
    }
}

// ============ 启动 ============
// 窗口缩放时所有 ECharts 图表自适应容器宽度
window.addEventListener('resize', ecResizeAll);

init();
