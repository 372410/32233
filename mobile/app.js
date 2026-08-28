/* ============================================================
   涂装MES 移动端交互逻辑
   所有业务数据均读取自 ../data.js 全局变量，本文件不定义业务数据
   ============================================================ */
(function () {
    'use strict';

    if (typeof PAGE_CONFIG === 'undefined') {
        document.body.innerHTML = '<p style="padding:40px 20px;text-align:center;color:#dc2626;">数据加载失败：请确认 ../data.js 文件存在</p>';
        return;
    }

    /* ---------- 数据访问层 ---------- */
    const ORDER_DATA = PAGE_CONFIG['production-order'].data;
    const TASK_DATA = PAGE_CONFIG['production-task'].data;
    const EQUIP_DATA = PAGE_CONFIG['equipment-list'].data;
    const EMP_DATA = PAGE_CONFIG['sys-employee'].data;
    const REPORT_DATA = PAGE_CONFIG['work-report'].data;
    const LINE_DATA = PAGE_CONFIG['production-line'].data;
    const DEFECT_OPTIONS = PAGE_CONFIG['work-bench'].defectTypeOptions;
    const NOTICE_DATA = PAGE_CONFIG['dashboard-notice'].data;
    const QC_DATA = {
        '来料检': PAGE_CONFIG['qc-incoming'].data,
        '出货检': PAGE_CONFIG['qc-outgoing'].data,
        '过程检': PAGE_CONFIG['qc-process'].data,
        '成品入库检': PAGE_CONFIG['qc-finished'].data,
    };

    /* 原型演示密码（账号须为 data.js 员工表内的用户名） */
    const DEMO_PASSWORD = '123456';
    const LOGIN_STORE_KEY = 'mes-mobile-login';

    /* 状态 → 样式类（色标：生产中 #16a34a、待料 #f59e0b、异常 #dc2626、已完成 #6b7280） */
    const STATUS_CLS = { '生产中': 'tag-run', '待料': 'tag-wait', '异常': 'tag-error', '已完成': 'tag-done' };
    const STATUS_BAR_CLS = { '生产中': 'c-run', '待料': 'c-wait', '异常': 'c-error', '已完成': 'c-done' };

    let currentUser = null;
    let currentQcTab = '来料检';
    let subpageStack = [];
    /* 本次会话新提交的报工（内存级，刷新即重置） */
    const sessionReports = [];

    const $ = (id) => document.getElementById(id);
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const fmtQty = (n) => Number(n || 0).toLocaleString('zh-CN');
    const statusColor = (s) => ({ '生产中': '#16a34a', '待料': '#f59e0b', '异常': '#dc2626', '已完成': '#6b7280' }[s] || '#334155');

    /* ============================================================
       业务推导：工单状态 / 当前节点
       ============================================================ */
    function getOrderStatus(order) {
        if (order.finishStatus === '已完成') return '已完成';
        if (TASK_DATA.some((t) => t.productionOrderSn === order.orderNo && t.status === 'PAUSED')) return '异常';
        const prodNodes = order.nodes.filter((n) => n.name.indexOf('检') === -1);
        if (prodNodes.some((n) => n.pct > 0 && n.pct < 100)) return '生产中';
        return '待料';
    }

    function getCurrentNode(order) {
        const nodes = order.nodes;
        for (let i = nodes.length - 1; i >= 0; i--) {
            if (nodes[i].pct > 0 && nodes[i].pct < 100) return nodes[i];
        }
        if (nodes.length && nodes[nodes.length - 1].pct === 100) return nodes[nodes.length - 1];
        return nodes[0] || { name: '—', pct: 0, doneQty: 0 };
    }

    /* ---------- 看板指标推导 ---------- */
    function computeHomeStats() {
        const todayQty = DASHBOARD_DATA.todayReports.reduce((s, r) => s + r.qty, 0);
        const todayDefect = DASHBOARD_DATA.todayReports.reduce((s, r) => s + r.defectQty, 0);
        const passRate = todayQty > 0 ? ((todayQty - todayDefect) / todayQty) * 100 : 0;

        const rptQty = REPORT_DATA.reduce((s, r) => s + r.completedQty, 0);
        const rptDefect = REPORT_DATA.reduce((s, r) => s + r.defectQty, 0);
        const rptPass = rptQty > 0 ? ((rptQty - rptDefect) / rptQty) * 100 : 0;

        const running = EQUIP_DATA.filter((e) => e.status === '启用').length;
        const registered = EQUIP_DATA.filter((e) => e.status !== '报废').length;
        const oee = registered > 0 ? (running / registered) * rptPass : 0;

        const wip = ORDER_DATA.filter((o) => o.finishStatus === '未完成').length;
        return { todayQty, passRate, oee, wip };
    }

    /* ============================================================
       首页看板
       ============================================================ */
    function renderHome() {
        const s = computeHomeStats();

        $('homeDate').textContent = formatDate(new Date());
        $('homeUserName').textContent = currentUser ? currentUser.name : '--';
        $('homeAvatar').textContent = currentUser ? currentUser.name.charAt(0) : '--';

        const cards = [
            { label: '今日产量', value: fmtQty(s.todayQty), unit: '件', color: '#2563eb', bg: 'rgba(37,99,235,0.09)',
              icon: '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/>' },
            { label: '合格率', value: s.passRate.toFixed(1), unit: '%', color: '#16a34a', bg: 'rgba(22,163,74,0.10)',
              icon: '<path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/><path d="M8.5 12l2.5 2.5L16 9.5"/>' },
            { label: '设备OEE', value: s.oee.toFixed(1), unit: '%', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',
              icon: '<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M12 9V3"/><path d="M4.2 6.2l3.6 3.6"/><path d="M19.8 6.2l-3.6 3.6"/><path d="M2 15h4"/><path d="M18 15h4"/>' },
            { label: '在制工单', value: fmtQty(s.wip), unit: '单', color: '#334155', bg: 'rgba(51,65,85,0.08)',
              icon: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8"/><path d="M8 12h8"/><path d="M8 16h5"/>' },
        ];

        $('statsGrid').innerHTML = cards.map((c) => (
            '<div class="stat-card">' +
                '<div class="stat-top">' +
                    '<span class="stat-icon" style="background:' + c.bg + ';color:' + c.color + '">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + c.icon + '</svg>' +
                    '</span>' +
                    '<span class="stat-label">' + esc(c.label) + '</span>' +
                '</div>' +
                '<div class="stat-value">' + esc(c.value) + '<span class="unit">' + esc(c.unit) + '</span></div>' +
            '</div>'
        )).join('');

        const priority = { '异常': 0, '生产中': 1, '待料': 2, '已完成': 3 };
        const pending = ORDER_DATA
            .filter((o) => getOrderStatus(o) !== '已完成')
            .sort((a, b) => priority[getOrderStatus(a)] - priority[getOrderStatus(b)]);

        $('pendingCount').textContent = pending.length + ' 单';
        $('pendingList').innerHTML = pending.length
            ? pending.map(renderMiniOrder).join('')
            : '<div class="empty-tip">暂无待处理工单</div>';
    }

    function renderMiniOrder(order) {
        const status = getOrderStatus(order);
        const node = getCurrentNode(order);
        return (
            '<div class="order-card" data-order="' + esc(order.orderNo) + '">' +
                '<div class="order-head">' +
                    '<span class="order-no">' + esc(order.orderNo) + '</span>' +
                    (order.urgent === '是' ? '<span class="urgent-flag">加急</span>' : '') +
                    '<span class="tag ' + STATUS_CLS[status] + '">' + esc(status) + '</span>' +
                '</div>' +
                '<div class="order-fields">' +
                    '<div class="field"><span class="field-label">产品型号</span><span class="field-value">' + esc(order.productCode) + '</span></div>' +
                    '<div class="field"><span class="field-label">产品名称</span><span class="field-value">' + esc(order.productName) + '</span></div>' +
                '</div>' +
                '<div class="progress-wrap">' +
                    '<div class="progress-meta">' +
                        '<span class="progress-name">当前工序 · ' + esc(node.name) + '</span>' +
                        '<span class="progress-pct" style="color:' + statusColor(status) + '">' + node.pct + '%</span>' +
                    '</div>' +
                    '<div class="progress-track"><div class="progress-bar ' + STATUS_BAR_CLS[status] + '" style="width:' + node.pct + '%"></div></div>' +
                '</div>' +
            '</div>'
        );
    }

    /* ============================================================
       质量检查（四类检验）
       ============================================================ */
    function renderQc() {
        const list = QC_DATA[currentQcTab] || [];
        const total = Object.keys(QC_DATA).reduce((s, k) => s + QC_DATA[k].length, 0);
        $('qcSummary').textContent = currentQcTab + ' · ' + list.length + ' 条（全部 ' + total + ' 条）';

        $('qcList').innerHTML = list.length ? list.map((r, i) => renderQcCard(r, i)).join('')
            : '<div class="empty-tip">暂无「' + esc(currentQcTab) + '」任务</div>';
    }

    function renderQcCard(r, i) {
        const conclCls = r.conclusion === '不合格' ? 'tag-error' : 'tag-run';
        return (
            '<div class="qc-card" data-qc="' + i + '">' +
                '<div class="qc-card-head">' +
                    '<div style="min-width:0">' +
                        '<div class="qc-order-no">' + esc(r.orderNo) + '</div>' +
                        '<span class="tag tag-info" style="margin-top:6px">' + esc(r.taskType) + '</span>' +
                    '</div>' +
                    '<div class="qc-qty">' +
                        '<div class="qc-qty-num">' + fmtQty(r.taskQty) + '</div>' +
                        '<div class="qc-qty-label">任务数量</div>' +
                    '</div>' +
                '</div>' +
                '<div class="order-fields">' +
                    '<div class="field"><span class="field-label">产品编码</span><span class="field-value">' + esc(r.productCode) + '</span></div>' +
                    '<div class="field"><span class="field-label">产品名称</span><span class="field-value">' + esc(r.productName) + '</span></div>' +
                    '<div class="field"><span class="field-label">工序名称</span><span class="field-value">' + esc(r.processName) + '</span></div>' +
                    '<div class="field"><span class="field-label">客户名称</span><span class="field-value">' + esc(r.customerName) + '</span></div>' +
                    '<div class="field"><span class="field-label">交付日期</span><span class="field-value num">' + esc(r.deliveryDate) + '</span></div>' +
                    '<div class="field"><span class="field-label">合格率</span><span class="field-value num">' + r.passRate + '%</span></div>' +
                '</div>' +
                '<div class="progress-wrap">' +
                    '<div class="progress-track"><div class="progress-bar ' + (r.conclusion === '不合格' ? 'c-error' : 'c-run') + '" style="width:' + Math.min(r.passRate, 100) + '%"></div></div>' +
                '</div>' +
                '<div class="qc-conclusion">' +
                    '<span class="tag ' + conclCls + '">' + esc(r.conclusion) + '</span>' +
                    '<span class="qc-report-no">报告编号 ' + esc(r.reportNo) + '</span>' +
                '</div>' +
            '</div>'
        );
    }

    /* ============================================================
       工作台（分组宫格）
       ============================================================ */
    function renderBench() {
        $('benchUser').textContent = currentUser ? currentUser.name + ' · ' + currentUser.role : '--';

        const unread = NOTICE_DATA.filter((n) => n.status === '未读').length;

        const icon = {
            order: '<path d="M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
            task: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 12l3 3 5-6"/>',
            report: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
            bench: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
            equip: '<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9.5" y="9.5" width="5" height="5"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
            repair: '<path d="M14.7 6.3a4.5 4.5 0 0 0-6 6L3 18l3 3 5.7-5.7a4.5 4.5 0 0 0 6-6L14 13l-3-3z"/>',
            plan: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
            item: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 15l2 2 4-4"/>',
            inspect: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35M8 11l2 2 4-4"/>',
            stock: '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
            inout: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 21h16"/>',
            set: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.7l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.7-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.7.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.7 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.7.3h0a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5h0a1.6 1.6 0 0 0 1.7-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.7v0a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
            notice: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
        };

        const groups = [
            { title: '系统', color: '#64748b', bg: 'rgba(100,116,139,0.10)', items: [
                { name: '设置', ic: 'set', action: 'settings' }, { name: '通知', ic: 'notice', action: 'notice', badge: unread },
            ]},
            { title: '生产管理', color: '#2563eb', bg: 'rgba(37,99,235,0.09)', items: [
                { name: '生产订单', ic: 'order', action: 'deny' }, { name: '生产任务', ic: 'task', action: 'deny' },
                { name: '报工记录', ic: 'report', action: 'deny' }, { name: '报工工作台', ic: 'bench', action: 'deny' },
            ]},
            { title: '设备管理', color: '#0d9488', bg: 'rgba(13,148,136,0.09)', items: [
                { name: '设备列表', ic: 'equip', action: 'deny' }, { name: '设备报修', ic: 'repair', action: 'deny' }, { name: '维修类型', ic: 'item', action: 'deny' },
            ]},
            { title: '保养计划', color: '#16a34a', bg: 'rgba(22,163,74,0.09)', items: [
                { name: '保养计划', ic: 'plan', action: 'deny' }, { name: '保养项目', ic: 'item', action: 'deny' },
                { name: '点检计划', ic: 'plan', action: 'deny' }, { name: '点检项目', ic: 'item', action: 'deny' },
                { name: '任务处理', ic: 'task', action: 'deny' },
            ]},
            { title: '质检设置', color: '#f59e0b', bg: 'rgba(245,158,11,0.11)', items: [
                { name: '检验项目', ic: 'inspect' }, { name: '质检方案', ic: 'item' },
            ]},
            { title: '库存管理', color: '#7c3aed', bg: 'rgba(124,58,237,0.09)', items: [
                { name: '其他入库', ic: 'inout', action: 'deny' }, { name: '其他出库', ic: 'stock', action: 'deny' },
            ]},
        ];

        $('benchGrid').innerHTML = groups.map((g) => (
            '<div class="bench-group">' +
                '<div class="bench-group-title">' + esc(g.title) + '</div>' +
                '<div class="bench-grid">' +
                    g.items.map((it) => (
                        '<button class="bench-item" data-bench="' + esc(it.action || '') + '">' +
                            '<span class="bench-icon" style="color:' + g.color + ';background:' + g.bg + '">' +
                                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + icon[it.ic] + '</svg>' +
                                (it.badge ? '<span class="bench-badge">' + it.badge + '</span>' : '') +
                            '</span>' +
                            '<span class="bench-name">' + esc(it.name) + '</span>' +
                        '</button>'
                    )).join('') +
                '</div>' +
            '</div>'
        )).join('');
    }

    /* ============================================================
       子页：我的通知（数据来自 data.js 消息通知）
       ============================================================ */
    const NOTICE_TYPE_CLS = {
        '系统通知': 'nt-sys', '生产提醒': 'nt-prod',
        '设备告警': 'nt-equip', '质检通知': 'nt-qc',
    };

    function renderNotice() {
        const unread = NOTICE_DATA.filter((n) => n.status === '未读').length;

        $('noticeBody').innerHTML =
            '<div class="report-banner">' +
                '<span class="report-banner-label">收到的通知</span>' +
                '<span class="notice-status ' + (unread ? 'ns-unread' : 'ns-read') + '">' + (unread ? unread + ' 条未读' : '全部已读') + '</span>' +
            '</div>' +
            NOTICE_DATA.map((n) => (
                '<div class="notice-card' + (n.status === '已读' ? ' read' : '') + '">' +
                    (n.status === '未读' ? '<span class="notice-unread-dot"></span>' : '') +
                    '<div class="notice-head">' +
                        '<span class="notice-title">' + esc(n.title) + '</span>' +
                        '<span class="notice-type ' + (NOTICE_TYPE_CLS[n.type] || 'nt-sys') + '">' + esc(n.type) + '</span>' +
                    '</div>' +
                    '<p class="notice-content">' + esc(n.content) + '</p>' +
                    '<div class="notice-foot">' +
                        '<span class="notice-time">' + esc(n.time) + '</span>' +
                        '<span class="notice-status ' + (n.status === '未读' ? 'ns-unread' : 'ns-read') + '">' + esc(n.status) + '</span>' +
                    '</div>' +
                '</div>'
            )).join('');
    }

    /* ============================================================
       子页：设置（基础设置展示，无实际功能）
       ============================================================ */
    function renderSettings() {
        const row = (name, icon, color, bg, right) => (
            '<div class="set-row">' +
                '<span class="set-row-icon" style="color:' + color + ';background:' + bg + '">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + icon + '</svg>' +
                '</span>' +
                '<span class="set-name">' + esc(name) + '</span>' + right +
            '</div>'
        );

        const iBell = '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>';
        const iSound = '<path d="M11 5L6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/>';
        const iFont = '<path d="M4 7V5h16v2"/><path d="M12 5v14"/><path d="M9 19h6"/>';
        const iCache = '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>';
        const iUpdate = '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>';
        const iUser = '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>';
        const iInfo = '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4"/><path d="M12 8h.01"/>';
        const iPhone = '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z"/>';

        $('settingsBody').innerHTML =
            '<p class="set-group-title">消息提醒</p>' +
            '<div class="set-card">' +
                row('接收消息通知', iBell, '#2563eb', 'rgba(37,99,235,0.09)', '<span class="switch on" data-switch="1"></span>') +
                row('声音提醒', iSound, '#f59e0b', 'rgba(245,158,11,0.12)', '<span class="switch" data-switch="1"></span>') +
            '</div>' +
            '<p class="set-group-title">通用</p>' +
            '<div class="set-card">' +
                row('字体大小', iFont, '#0d9488', 'rgba(13,148,136,0.09)', '<span class="set-value">标准</span><svg class="set-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>') +
                row('清除缓存', iCache, '#7c3aed', 'rgba(124,58,237,0.09)', '<span class="set-value">12.6 MB</span><svg class="set-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>') +
                row('检查更新', iUpdate, '#16a34a', 'rgba(22,163,74,0.10)', '<span class="set-value">v1.0.0 已是最新</span><svg class="set-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>') +
            '</div>' +
            '<p class="set-group-title">账号</p>' +
            '<div class="set-card">' +
                row('当前账号', iUser, '#334155', 'rgba(51,65,85,0.08)', '<span class="set-value">' + esc(currentUser ? currentUser.name : '—') + '</span>') +
                row('所属部门', iInfo, '#64748b', 'rgba(100,116,139,0.10)', '<span class="set-value">' + esc(currentUser ? currentUser.dept : '—') + '</span>') +
                row('联系电话', iPhone, '#2563eb', 'rgba(37,99,235,0.09)', '<span class="set-value">' + esc(currentUser && currentUser.phone ? currentUser.phone : '—') + '</span>') +
            '</div>' +
            '<p class="set-group-title" style="text-align:center;padding-top:4px">涂装MES 移动端 · v1.0.0</p>';
    }

    /* ============================================================
       我的（含报工记录）
       ============================================================ */
    function myReports() {
        const name = currentUser ? currentUser.name : '';
        const base = REPORT_DATA.filter((r) => r.reporter === name).map((r) => ({
            orderNo: r.orderNo, productName: r.product, processName: r.processName,
            completedQty: r.completedQty, defectQty: r.defectQty, defectReason: r.defectReason,
            reportTime: r.reportTime, isNew: false,
        }));
        return base.concat(sessionReports).sort((a, b) => (a.reportTime < b.reportTime ? 1 : -1));
    }

    function renderProfile() {
        const emp = currentUser || {};
        const team = LINE_DATA.length ? LINE_DATA[0].name : '—';
        const reports = myReports();
        const myQty = reports.reduce((s, r) => s + r.completedQty, 0);

        $('profileAvatar').textContent = emp.name ? emp.name.charAt(0) : '--';
        $('profileName').textContent = emp.name || '--';
        $('profileDept').textContent = (emp.dept || '—') + (emp.role ? ' · ' + emp.role : '');
        $('infoRole').textContent = emp.role || '—';
        $('infoTeam').textContent = team + (emp.dept ? '（' + emp.dept + '）' : '');
        $('infoReport').textContent = reports.length ? fmtQty(myQty) + ' 件（' + reports.length + ' 次）' : '今日暂无报工';
        $('infoPhone').textContent = emp.phone || '—';

        $('myReportCount').textContent = reports.length + ' 条';
        $('myReportList').innerHTML = reports.length ? reports.map((r) => (
            '<div class="report-card">' +
                '<div class="report-head">' +
                    '<span class="order-no">' + esc(r.orderNo) + '</span>' +
                    (r.isNew ? '<span class="report-new-flag">本次会话</span>' : '') +
                '</div>' +
                '<div class="order-fields">' +
                    '<div class="field"><span class="field-label">产品名称</span><span class="field-value">' + esc(r.productName) + '</span></div>' +
                    '<div class="field"><span class="field-label">工序名称</span><span class="field-value">' + esc(r.processName) + '</span></div>' +
                    '<div class="field"><span class="field-label">完成数量</span><span class="field-value num">' + fmtQty(r.completedQty) + ' 件</span></div>' +
                    '<div class="field"><span class="field-label">不良数量</span><span class="field-value num" style="color:' + (r.defectQty > 0 ? '#dc2626' : 'inherit') + '">' + fmtQty(r.defectQty) + ' 件</span></div>' +
                '</div>' +
                '<div class="qc-conclusion" style="margin-top:10px">' +
                    '<span class="qc-report-no">' + (r.defectQty > 0 ? '不良原因：' + esc(r.defectReason || '—') : '') + '</span>' +
                '</div>' +
                '<div class="report-time" style="margin-top:4px">报工时间 · ' + esc(r.reportTime) + '</div>' +
            '</div>'
        )).join('') : '<div class="empty-tip">暂无报工记录</div>';
    }

    /* ============================================================
       子页：工单详情
       ============================================================ */
    let detailOrderNo = null;

    function openOrderDetail(orderNo) {
        const order = ORDER_DATA.find((o) => o.orderNo === orderNo);
        if (!order) return;
        detailOrderNo = orderNo;
        const status = getOrderStatus(order);

        const infoRows = [
            ['客户单号', order.customerOrderNo], ['内部工单号', order.orderNo],
            ['产品编码', order.productCode], ['产品名称', order.productName],
            ['计划数量', fmtQty(order.quantity) + ' 件'], ['交付日期', order.deliveryDate],
            ['订单类型', order.type], ['工艺路线', order.route],
            ['创建人', order.creator], ['创建时间', order.createTime],
        ];

        $('orderDetailBody').innerHTML =
            '<div class="report-banner">' +
                '<span class="report-banner-label">工单状态</span>' +
                '<span>' +
                    (order.urgent === '是' ? '<span class="urgent-flag" style="margin-right:8px">加急</span>' : '') +
                    '<span class="tag ' + STATUS_CLS[status] + '">' + esc(status) + '</span>' +
                '</span>' +
            '</div>' +
            '<div class="detail-card">' +
                '<div class="detail-title-bar"><span class="detail-title">基本信息</span></div>' +
                infoRows.map((row) => (
                    '<div class="detail-row">' +
                        '<span class="detail-label">' + esc(row[0]) + '</span>' +
                        '<span class="detail-value">' + esc(row[1] || '—') + '</span>' +
                    '</div>'
                )).join('') +
            '</div>' +
            '<div class="detail-card">' +
                '<div class="detail-title-bar"><span class="detail-title">工序节点（' + order.nodes.length + '）</span></div>' +
                order.nodes.map(renderNodeItem).join('') +
            '</div>';

        openSubpage('page-order-detail');
    }

    function renderNodeItem(n) {
        let tagCls, tagTxt, tagColor;
        if (n.pct >= 100) { tagCls = 'node-tag'; tagTxt = '已完成'; tagColor = 'color:#6b7280;background:rgba(107,114,128,0.12)'; }
        else if (n.pct > 0) { tagCls = 'node-tag'; tagTxt = '进行中'; tagColor = 'color:#16a34a;background:rgba(22,163,74,0.10)'; }
        else { tagCls = 'node-tag'; tagTxt = '未开始'; tagColor = 'color:#f59e0b;background:rgba(245,158,11,0.12)'; }

        return (
            '<div class="node-item">' +
                '<div class="node-head">' +
                    '<span class="node-name">' + esc(n.name) + '</span>' +
                    '<span class="' + tagCls + '" style="' + tagColor + '">' + tagTxt + '</span>' +
                    '<span class="progress-pct" style="margin-left:auto;color:' + (n.pct >= 100 ? '#6b7280' : n.pct > 0 ? '#16a34a' : '#f59e0b') + '">' + n.pct + '%</span>' +
                '</div>' +
                '<div class="progress-track" style="margin-bottom:8px"><div class="progress-bar ' + (n.pct >= 100 ? 'c-done' : n.pct > 0 ? 'c-run' : 'c-wait') + '" style="width:' + n.pct + '%"></div></div>' +
                '<div class="node-meta">' +
                    '<div class="field"><span class="field-label">计划 / 完成</span><span class="field-value num">' + fmtQty(n.planQty) + ' / ' + fmtQty(n.doneQty) + ' 件</span></div>' +
                    '<div class="field"><span class="field-label">计划时间</span><span class="field-value">' + esc(n.planStart || '—') + ' ~ ' + esc(n.planEnd || '—') + '</span></div>' +
                    '<div class="field"><span class="field-label">实际开始</span><span class="field-value">' + esc(n.actualStart || '—') + '</span></div>' +
                    '<div class="field"><span class="field-label">实际结束</span><span class="field-value">' + esc(n.actualEnd || '—') + '</span></div>' +
                '</div>' +
            '</div>'
        );
    }

    /* ============================================================
       子页：质检报告
       ============================================================ */
    function openQcDetail(idx) {
        const r = (QC_DATA[currentQcTab] || [])[idx];
        if (!r) return;
        const conclCls = r.conclusion === '不合格' ? 'tag-error' : 'tag-run';

        const judgeCls = (j) => j === '合格' ? 'judge-pass' : j === '不合格' ? 'judge-fail' : j === '跳过' ? 'judge-skip' : 'judge-warn';

        const infoRows = [
            ['报告编号', r.reportNo], ['生产订单编号', r.orderNo], ['任务类型', r.taskType],
            ['产品编码', r.productCode], ['产品名称', r.productName], ['工序名称', r.processName],
            ['客户单号', r.customerOrderNo], ['客户名称', r.customerName], ['交付日期', r.deliveryDate],
            ['任务数量', fmtQty(r.taskQty) + ' 件'], ['实检数量', fmtQty(r.actualQty) + ' 件'], ['合格数量', fmtQty(r.passQty) + ' 件'],
            ['检验员', r.inspector], ['检验时间', r.inspectTime], ['创建时间', r.createTime],
        ];

        $('qcDetailBody').innerHTML =
            '<div class="report-banner">' +
                '<span class="report-banner-label">检验结论</span>' +
                '<span class="tag ' + conclCls + '">' + esc(r.conclusion) + '</span>' +
            '</div>' +
            '<div class="detail-card">' +
                '<div class="detail-title-bar"><span class="detail-title">基本信息</span></div>' +
                infoRows.map((row) => (
                    '<div class="detail-row">' +
                        '<span class="detail-label">' + esc(row[0]) + '</span>' +
                        '<span class="detail-value">' + esc(row[1] || '—') + '</span>' +
                    '</div>'
                )).join('') +
            '</div>' +
            '<div class="detail-card">' +
                '<div class="detail-title-bar"><span class="detail-title">合格率</span><span class="progress-pct" style="color:' + (r.conclusion === '不合格' ? '#dc2626' : '#16a34a') + '">' + r.passRate + '%</span></div>' +
                '<div class="progress-track" style="margin:2px 0 12px"><div class="progress-bar ' + (r.conclusion === '不合格' ? 'c-error' : 'c-run') + '" style="width:' + Math.min(r.passRate, 100) + '%"></div></div>' +
            '</div>' +
            '<div class="detail-card">' +
                '<div class="detail-title-bar"><span class="detail-title">检验项目明细</span></div>' +
                '<table class="qc-item-table">' +
                    '<tr><th>检验项目</th><th>检验结果</th><th>判定</th></tr>' +
                    r.items.map((it) => (
                        '<tr><td>' + esc(it.item) + '</td><td class="result">' + esc(it.result || '—') + '</td>' +
                        '<td><span class="judge-pill ' + judgeCls(it.judge) + '">' + esc(it.judge) + '</span></td></tr>'
                    )).join('') +
                '</table>' +
            '</div>' +
            '<div class="detail-card">' +
                '<div class="detail-title-bar"><span class="detail-title">现场照片</span></div>' +
                '<div class="photo-chips">' +
                    r.photos.map((p) => (
                        '<span class="photo-chip">' +
                            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>' +
                            esc(p.label) +
                        '</span>'
                    )).join('') +
                '</div>' +
            '</div>' +
            (r.remark ? (
                '<div class="detail-card"><div class="detail-title-bar"><span class="detail-title">备注说明</span></div>' +
                '<p style="font-size:14px;color:var(--text-sub);line-height:1.6;padding-bottom:12px">' + esc(r.remark) + '</p></div>'
            ) : '');

        openSubpage('page-qc-detail');
    }

    /* ============================================================
       子页：报工表单
       ============================================================ */
    let formOrderNo = null;   // null = 未锁定（扫码进入，可选工单）

    function openReportForm(orderNo) {
        formOrderNo = orderNo || null;
        renderReportForm();
        openSubpage('page-report-form');
    }

    function renderReportForm() {
        const selectable = ORDER_DATA.filter((o) => getOrderStatus(o) !== '已完成');
        const first = formOrderNo || (selectable.length ? selectable[0].orderNo : null);
        if (!first) {
            $('reportFormBody').innerHTML = '<div class="empty-tip">暂无可报工的工单</div>';
            return;
        }
        const order = ORDER_DATA.find((o) => o.orderNo === first);
        const node = getCurrentNode(order);

        $('reportFormBody').innerHTML =
            '<div class="form-card">' +
                '<div class="form-row">' +
                    '<span class="form-label">生产工单<span class="req">*</span></span>' +
                    (formOrderNo
                        ? '<span class="form-static">' + esc(formOrderNo) + '</span>'
                        : '<select class="form-control" id="rfOrder">' +
                              selectable.map((o) => '<option value="' + esc(o.orderNo) + '"' + (o.orderNo === first ? ' selected' : '') + '>' + esc(o.orderNo) + ' · ' + esc(o.productName) + '</option>').join('') +
                          '</select>') +
                '</div>' +
                '<div class="form-row">' +
                    '<span class="form-label">工序<span class="req">*</span></span>' +
                    '<select class="form-control" id="rfProcess">' +
                        order.nodes.map((n) => '<option value="' + esc(n.name) + '"' + (n.name === node.name ? ' selected' : '') + '>' + esc(n.name) + '（' + n.pct + '%）</option>').join('') +
                    '</select>' +
                '</div>' +
                '<div class="form-row">' +
                    '<span class="form-label">报工人</span>' +
                    '<span class="form-static">' + esc(currentUser ? currentUser.name : '—') + '</span>' +
                '</div>' +
                '<div class="form-row">' +
                    '<span class="form-label">完成数量<span class="req">*</span></span>' +
                    '<input type="number" class="form-control" id="rfQty" inputmode="numeric" min="1" placeholder="请输入数量">' +
                '</div>' +
                '<div class="form-row">' +
                    '<span class="form-label">不良数量</span>' +
                    '<input type="number" class="form-control" id="rfDefect" inputmode="numeric" min="0" value="0" placeholder="0">' +
                '</div>' +
                '<div class="form-row">' +
                    '<span class="form-label">不良原因</span>' +
                    '<select class="form-control" id="rfReason"><option value="">无不良</option>' +
                        DEFECT_OPTIONS.map((d) => '<option value="' + esc(d) + '">' + esc(d) + '</option>').join('') +
                    '</select>' +
                '</div>' +
                '<div class="form-row column">' +
                    '<span class="form-label">备注</span>' +
                    '<textarea class="form-control" id="rfRemark" placeholder="选填，如设备参数、异常说明"></textarea>' +
                '</div>' +
                '<p class="form-err" id="rfErr"></p>' +
            '</div>' +
            '<div class="detail-card" style="margin-bottom:0">' +
                '<div class="detail-title-bar"><span class="detail-title">工单信息</span></div>' +
                '<div class="detail-row"><span class="detail-label">产品名称</span><span class="detail-value">' + esc(order.productName) + '</span></div>' +
                '<div class="detail-row"><span class="detail-label">计划数量</span><span class="detail-value">' + fmtQty(order.quantity) + ' 件</span></div>' +
                '<div class="detail-row"><span class="detail-label">当前工序进度</span><span class="detail-value">' + esc(node.name) + ' · ' + node.pct + '%</span></div>' +
            '</div>';

        const orderSel = $('rfOrder');
        if (orderSel) {
            orderSel.addEventListener('change', function () {
                const o = ORDER_DATA.find((x) => x.orderNo === this.value);
                const sel = $('rfProcess');
                if (o && sel) {
                    const cur = getCurrentNode(o);
                    sel.innerHTML = o.nodes.map((n) => '<option value="' + esc(n.name) + '"' + (n.name === cur.name ? ' selected' : '') + '>' + esc(n.name) + '（' + n.pct + '%）</option>').join('');
                }
            });
        }
    }

    function submitReport() {
        const orderSel = $('rfOrder');
        const orderNo = formOrderNo || (orderSel ? orderSel.value : null);
        const order = ORDER_DATA.find((o) => o.orderNo === orderNo);
        if (!order) return;

        const qty = parseInt($('rfQty').value, 10);
        const defect = parseInt($('rfDefect').value, 10) || 0;
        const reason = $('rfReason').value;
        const err = $('rfErr');

        if (!qty || qty <= 0) { err.textContent = '请输入大于 0 的完成数量'; return; }
        if (defect < 0 || defect > qty) { err.textContent = '不良数量需在 0 ~ 完成数量之间'; return; }
        if (defect > 0 && !reason) { err.textContent = '存在不良时请选择不良原因'; return; }
        err.textContent = '';

        const node = order.nodes.find((n) => n.name === $('rfProcess').value) || getCurrentNode(order);
        node.doneQty = Math.min(node.planQty, (node.doneQty || 0) + qty);
        node.pct = node.planQty > 0 ? Math.round((node.doneQty / node.planQty) * 100) : 0;

        sessionReports.push({
            orderNo: order.orderNo,
            productName: order.productName,
            processName: node.name,
            completedQty: qty,
            defectQty: defect,
            defectReason: reason,
            reportTime: formatTime(new Date()),
            isNew: true,
        });

        closeAllSubpages();
        renderHome();
        renderProfile();
        showToast('报工提交成功：' + order.orderNo + ' · ' + node.name + ' +' + qty + ' 件');
    }

    /* ============================================================
       子页栈 / 弹窗 / Toast
       ============================================================ */
    function openSubpage(id) {
        subpageStack.push(id);
        $(id).classList.add('open');
    }

    function closeTopSubpage() {
        const id = subpageStack.pop();
        if (id) $(id).classList.remove('open');
    }

    function closeAllSubpages() {
        subpageStack.forEach((id) => $(id).classList.remove('open'));
        subpageStack = [];
    }

    let toastTimer = null;
    function showToast(msg) {
        const t = $('toast');
        t.textContent = msg;
        t.classList.remove('hidden');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => t.classList.add('hidden'), 2200);
    }

    /* ============================================================
       登录 / 退出
       ============================================================ */
    function initLogin() {
        const saved = localStorage.getItem(LOGIN_STORE_KEY);
        if (saved) {
            try {
                const v = JSON.parse(saved);
                $('loginUser').value = v.user || 'zhangsan';
                $('loginPwd').value = v.pwd || DEMO_PASSWORD;
                $('rememberPwd').checked = true;
            } catch (e) { /* 忽略本地缓存异常 */ }
        }

        $('togglePwd').addEventListener('click', function () {
            const input = $('loginPwd');
            input.type = input.type === 'password' ? 'text' : 'password';
        });

        $('loginForm').addEventListener('submit', function (e) {
            e.preventDefault();
            const user = $('loginUser').value.trim();
            const pwd = $('loginPwd').value;
            const emp = EMP_DATA.find((x) => x.username === user);

            if (!emp || pwd !== DEMO_PASSWORD) {
                $('loginError').textContent = '账号或密码错误，请重新输入';
                return;
            }
            $('loginError').textContent = '';

            if ($('rememberPwd').checked) {
                localStorage.setItem(LOGIN_STORE_KEY, JSON.stringify({ user: user, pwd: pwd }));
            } else {
                localStorage.removeItem(LOGIN_STORE_KEY);
            }

            currentUser = emp;
            enterApp();
        });
    }

    function enterApp() {
        $('loginView').classList.add('hidden');
        $('appView').classList.remove('hidden');
        renderHome();
        renderQc();
        renderBench();
        renderProfile();
        switchTab('page-home');
    }

    function logout() {
        currentUser = null;
        sessionReports.length = 0;
        closeAllSubpages();
        $('scanModal').classList.add('hidden');
        $('appView').classList.add('hidden');
        $('loginView').classList.remove('hidden');
        $('loginError').textContent = '';
        window.scrollTo(0, 0);
    }

    /* ============================================================
       Tab 切换
       ============================================================ */
    function switchTab(pageId) {
        document.querySelectorAll('.page').forEach((p) => p.classList.toggle('active', p.id === pageId));
        document.querySelectorAll('.tabbar .tab-item[data-page]').forEach((t) => t.classList.toggle('active', t.dataset.page === pageId));
        window.scrollTo(0, 0);
    }

    function formatDate(d) {
        const weeks = ['日', '一', '二', '三', '四', '五', '六'];
        return d.getFullYear() + ' 年 ' + (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日 · 周' + weeks[d.getDay()];
    }

    function formatTime(d) {
        const p = (n) => (n < 10 ? '0' + n : '' + n);
        return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
    }

    /* ============================================================
       事件绑定
       ============================================================ */
    document.querySelectorAll('.tabbar .tab-item[data-page]').forEach((btn) => {
        btn.addEventListener('click', function () { switchTab(this.dataset.page); });
    });

    /* 中央 + 号：扫码报工弹窗 */
    $('scanBtn').addEventListener('click', function () {
        $('scanModal').classList.remove('hidden');
    });

    $('scanModal').addEventListener('click', function (e) {
        if (e.target === this || e.target.closest('[data-close]')) {
            $('scanModal').classList.add('hidden');
        }
    });

    $('scanGoBtn').addEventListener('click', function () {
        $('scanModal').classList.add('hidden');
        openReportForm(null);
    });

    /* 子页返回 */
    document.querySelectorAll('[data-back]').forEach((btn) => {
        btn.addEventListener('click', closeTopSubpage);
    });

    /* 首页待处理工单 → 详情 */
    $('pendingList').addEventListener('click', function (e) {
        const card = e.target.closest('[data-order]');
        if (card) openOrderDetail(card.dataset.order);
    });

    /* 工单详情底部报工按钮 */
    $('orderReportBtn').addEventListener('click', function () {
        openReportForm(detailOrderNo);
    });

    /* 质检 Tab 筛选 */
    document.querySelectorAll('#qcFilter .filter-btn').forEach((btn) => {
        btn.addEventListener('click', function () {
            currentQcTab = this.dataset.qc;
            document.querySelectorAll('#qcFilter .filter-btn').forEach((b) => b.classList.toggle('active', b === this));
            renderQc();
        });
    });

    /* 质检卡片 → 报告详情 */
    $('qcList').addEventListener('click', function (e) {
        const card = e.target.closest('[data-qc]');
        if (card) openQcDetail(parseInt(card.dataset.qc, 10));
    });

    /* 工作台宫格：四组业务模块无权限，设置/通知进入子页 */
    $('benchGrid').addEventListener('click', function (e) {
        const sw = e.target.closest('[data-switch]');
        if (sw) { sw.classList.toggle('on'); return; }

        const item = e.target.closest('[data-bench]');
        if (!item) return;
        const action = item.dataset.bench;
        const name = item.querySelector('.bench-name').textContent;

        if (action === 'deny') {
            $('denyModal').classList.remove('hidden');
        } else if (action === 'notice') {
            renderNotice();
            openSubpage('page-notice');
        } else if (action === 'settings') {
            renderSettings();
            openSubpage('page-settings');
        } else {
            showToast('「' + name + '」原型演示，敬请期待');
        }
    });

    /* 权限不足弹窗关闭 */
    $('denyModal').addEventListener('click', function (e) {
        if (e.target === this || e.target.closest('[data-close]')) {
            $('denyModal').classList.add('hidden');
        }
    });

    /* 报工提交 */
    $('reportSubmitBtn').addEventListener('click', submitReport);

    $('logoutBtn').addEventListener('click', logout);

    initLogin();
})();
