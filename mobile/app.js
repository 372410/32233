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

    /* 原型演示密码（账号须为 data.js 员工表内的用户名） */
    const DEMO_PASSWORD = '123456';
    const LOGIN_STORE_KEY = 'mes-mobile-login';

    /* 状态 → 样式类 / 颜色（色标按规范：生产中 #16a34a、待料 #f59e0b、异常 #dc2626、已完成 #6b7280） */
    const STATUS_CLS = { '生产中': 'tag-run', '待料': 'tag-wait', '异常': 'tag-error', '已完成': 'tag-done' };
    const STATUS_BAR_CLS = { '生产中': 'c-run', '待料': 'c-wait', '异常': 'c-error', '已完成': 'c-done' };
    const EQUIP_STATUS = {
        '启用': { label: '运行中', cls: 'tag-run' },
        '停用': { label: '待机', cls: 'tag-wait' },
        '维修中': { label: '故障', cls: 'tag-error' },
        '报废': { label: '停运', cls: 'tag-done' },
    };

    let currentUser = null;
    let currentFilter = '全部';

    const $ = (id) => document.getElementById(id);
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const fmtQty = (n) => Number(n || 0).toLocaleString('zh-CN');

    /* ============================================================
       业务推导：工单状态
       已完成 = finishStatus 为「已完成」
       异常   = 关联生产任务被暂停（PAUSED）
       生产中 = 存在进行中的生产工序节点（0 < pct < 100，检验工序除外）
       待料   = 生产工序均未开工
       ============================================================ */
    function getOrderStatus(order) {
        if (order.finishStatus === '已完成') return '已完成';
        const paused = TASK_DATA.some((t) => t.productionOrderSn === order.orderNo && t.status === 'PAUSED');
        if (paused) return '异常';
        const prodNodes = order.nodes.filter((n) => n.name.indexOf('检') === -1);
        if (prodNodes.some((n) => n.pct > 0 && n.pct < 100)) return '生产中';
        return '待料';
    }

    /* 当前工序节点：取最靠后的进行中节点；全部完成取末节点；未开工取首节点 */
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

        /* OEE = 时间开动率（启用设备 / 在册设备，剔除报废） × 合格率 */
        const running = EQUIP_DATA.filter((e) => e.status === '启用').length;
        const registered = EQUIP_DATA.filter((e) => e.status !== '报废').length;
        const oee = registered > 0 ? (running / registered) * rptPass : 0;

        const wip = ORDER_DATA.filter((o) => o.finishStatus === '未完成').length;
        return { todayQty, passRate, oee, wip };
    }

    /* ---------- 设备展示推导 ---------- */
    function getEquipProcess(eq) {
        const name = eq.name;
        if (name.indexOf('前处理') > -1) return '前处理';
        if (name.indexOf('喷涂') > -1) return '喷粉';
        if (name.indexOf('固化') > -1) return '固化烘烤';
        if (name.indexOf('烘干') > -1) return '烘干';
        if (name.indexOf('输送') > -1) return '全线输送';
        if (name.indexOf('空压') > -1) return '动力供应';
        return '—';
    }

    function getEquipRuntime(eq) {
        if (eq.status === '报废') return '已报废';
        const days = Math.floor((Date.now() - new Date(eq.purchaseDate).getTime()) / 86400000);
        if (days < 0) return '—';
        const years = Math.floor(days / 365);
        const rest = days % 365;
        return years > 0 ? years + ' 年 ' + rest + ' 天' : days + ' 天';
    }

    function getEquipIcon(eq) {
        const name = eq.name;
        if (name.indexOf('前处理') > -1) return '<path d="M12 2.7s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>';
        if (name.indexOf('喷涂') > -1) return '<path d="M3 8h9v5H3z"/><path d="M12 10h4l4-3v9l-4-3h-4"/><path d="M6 13v4"/>';
        if (name.indexOf('固化') > -1 || name.indexOf('烘干') > -1) return '<path d="M12 3c1.5 3-1 4-1 6a2.5 2.5 0 0 0 5 0c0-1-.5-2-1-3 2 1 4 3 4 6a6 6 0 0 1-12 0c0-4 4-6 5-9z"/>';
        if (name.indexOf('输送') > -1) return '<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M8.5 15.5h7L12 6z"/>';
        if (name.indexOf('空压') > -1) return '<path d="M3 8h9a3 3 0 1 0-3-3"/><path d="M3 12h13a3 3 0 1 1-3 3"/><path d="M3 16h6"/>';
        return '<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9.5" y="9.5" width="5" height="5"/>';
    }

    /* ============================================================
       渲染：首页看板
       ============================================================ */
    function renderHome() {
        const s = computeHomeStats();

        $('homeDate').textContent = formatDate(new Date());
        $('homeUserName').textContent = currentUser ? currentUser.name : '--';
        $('homeAvatar').textContent = currentUser ? currentUser.name.charAt(0) : '--';

        const cards = [
            {
                label: '今日产量', value: fmtQty(s.todayQty), unit: '件',
                color: '#2563eb', bg: 'rgba(37,99,235,0.09)',
                icon: '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/>',
            },
            {
                label: '合格率', value: s.passRate.toFixed(1), unit: '%',
                color: '#16a34a', bg: 'rgba(22,163,74,0.10)',
                icon: '<path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/><path d="M8.5 12l2.5 2.5L16 9.5"/>',
            },
            {
                label: '设备OEE', value: s.oee.toFixed(1), unit: '%',
                color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',
                icon: '<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M12 9V3"/><path d="M4.2 6.2l3.6 3.6"/><path d="M19.8 6.2l-3.6 3.6"/><path d="M2 15h4"/><path d="M18 15h4"/>',
            },
            {
                label: '在制工单', value: fmtQty(s.wip), unit: '单',
                color: '#334155', bg: 'rgba(51,65,85,0.08)',
                icon: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8"/><path d="M8 12h8"/><path d="M8 16h5"/>',
            },
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

        /* 待处理工单：未完成，按 异常 > 生产中 > 待料 排列 */
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
            '<div class="order-card">' +
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

    function statusColor(status) {
        return { '生产中': '#16a34a', '待料': '#f59e0b', '异常': '#dc2626', '已完成': '#6b7280' }[status] || '#334155';
    }

    /* ============================================================
       渲染：工单列表
       ============================================================ */
    function renderOrders() {
        $('orderTotal').textContent = '共 ' + ORDER_DATA.length + ' 单';
        const list = ORDER_DATA.filter((o) => currentFilter === '全部' || getOrderStatus(o) === currentFilter);

        $('orderList').innerHTML = list.length
            ? list.map(renderFullOrder).join('')
            : '<div class="empty-tip">暂无「' + esc(currentFilter) + '」状态的工单</div>';
    }

    function renderFullOrder(order) {
        const status = getOrderStatus(order);
        const node = getCurrentNode(order);
        return (
            '<div class="order-card">' +
                '<div class="order-head">' +
                    '<span class="order-no">' + esc(order.orderNo) + '</span>' +
                    (order.urgent === '是' ? '<span class="urgent-flag">加急</span>' : '') +
                    '<span class="tag ' + STATUS_CLS[status] + '">' + esc(status) + '</span>' +
                '</div>' +
                '<div class="order-fields">' +
                    '<div class="field"><span class="field-label">产品名称</span><span class="field-value">' + esc(order.productName) + '</span></div>' +
                    '<div class="field"><span class="field-label">产品型号</span><span class="field-value">' + esc(order.productCode) + '</span></div>' +
                    '<div class="field"><span class="field-label">计划数</span><span class="field-value num">' + fmtQty(order.quantity) + ' 件</span></div>' +
                    '<div class="field"><span class="field-label">完成数</span><span class="field-value num">' + fmtQty(node.doneQty) + ' 件</span></div>' +
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
       渲染：设备状态
       ============================================================ */
    function renderEquipment() {
        const count = {};
        EQUIP_DATA.forEach((e) => {
            const label = (EQUIP_STATUS[e.status] || { label: e.status }).label;
            count[label] = (count[label] || 0) + 1;
        });
        $('equipSummary').textContent = Object.keys(count).map((k) => k + ' ' + count[k]).join(' · ');

        $('equipmentList').innerHTML = EQUIP_DATA.map((eq) => {
            const st = EQUIP_STATUS[eq.status] || { label: eq.status, cls: 'tag-done' };
            return (
                '<div class="equip-card">' +
                    '<div class="equip-head">' +
                        '<span class="equip-icon">' +
                            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + getEquipIcon(eq) + '</svg>' +
                        '</span>' +
                        '<div class="equip-title">' +
                            '<div class="equip-name">' + esc(eq.name) + '</div>' +
                            '<div class="equip-code">' + esc(eq.code) + ' · ' + esc(eq.model) + '</div>' +
                        '</div>' +
                        '<span class="tag ' + st.cls + '">' + esc(st.label) + '</span>' +
                    '</div>' +
                    '<div class="equip-fields">' +
                        '<div class="field"><span class="field-label">当前工序</span><span class="field-value">' + esc(getEquipProcess(eq)) + '</span></div>' +
                        '<div class="field"><span class="field-label">运行时长</span><span class="field-value">' + esc(getEquipRuntime(eq)) + '</span></div>' +
                    '</div>' +
                '</div>'
            );
        }).join('');
    }

    /* ============================================================
       渲染：我的
       ============================================================ */
    function renderProfile() {
        const emp = currentUser || {};
        const team = LINE_DATA.length ? LINE_DATA[0].name : '—';
        const myReports = REPORT_DATA.filter((r) => r.reporter === emp.name);
        const myQty = myReports.reduce((s, r) => s + r.completedQty, 0);

        $('profileAvatar').textContent = emp.name ? emp.name.charAt(0) : '--';
        $('profileName').textContent = emp.name || '--';
        $('profileDept').textContent = (emp.dept || '—') + (emp.role ? ' · ' + emp.role : '');
        $('infoRole').textContent = emp.role || '—';
        $('infoTeam').textContent = team + (emp.dept ? '（' + emp.dept + '）' : '');
        $('infoReport').textContent = myReports.length
            ? fmtQty(myQty) + ' 件（' + myReports.length + ' 次）'
            : '今日暂无报工';
        $('infoPhone').textContent = emp.phone || '—';
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
        renderOrders();
        renderEquipment();
        renderProfile();
        switchTab('page-home');
    }

    function logout() {
        currentUser = null;
        $('appView').classList.add('hidden');
        $('loginView').classList.remove('hidden');
        $('loginError').textContent = '';
        window.scrollTo(0, 0);
    }

    /* ============================================================
       Tab 切换 / 筛选
       ============================================================ */
    function switchTab(pageId) {
        document.querySelectorAll('.page').forEach((p) => p.classList.toggle('active', p.id === pageId));
        document.querySelectorAll('.tab-item').forEach((t) => t.classList.toggle('active', t.dataset.page === pageId));
        window.scrollTo(0, 0);
    }

    function formatDate(d) {
        const weeks = ['日', '一', '二', '三', '四', '五', '六'];
        return d.getFullYear() + ' 年 ' + (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日 · 周' + weeks[d.getDay()];
    }

    /* ---------- 事件绑定 ---------- */
    document.querySelectorAll('.tab-item').forEach((btn) => {
        btn.addEventListener('click', function () { switchTab(this.dataset.page); });
    });

    document.querySelectorAll('.filter-btn').forEach((btn) => {
        btn.addEventListener('click', function () {
            currentFilter = this.dataset.filter;
            document.querySelectorAll('.filter-btn').forEach((b) => b.classList.toggle('active', b === this));
            renderOrders();
        });
    });

    $('logoutBtn').addEventListener('click', logout);

    initLogin();
})();
