/**
 * 涂装MES系统 - 数据配置

 * 包含所有12个模块的页面配置和数据
 */

// 导航菜单结构（与实际系统一致）
const MENU = [
    { id: 'dashboard', icon: '🏠', label: '首页', children: [
        { id: 'dashboard-overview', label: '数据概览', page: 'dashboard-overview' },
        { id: 'dashboard-notice', label: '消息通知', page: 'dashboard-notice' },
    ]},
    { id: 'product', icon: '📦', label: '产品管理', children: [
        { id: 'product-list', label: '产品管理', page: 'product-list' },
        { id: 'product-type', label: '产品类型', page: 'product-type' },
        { id: 'customer', label: '客户管理', page: 'customer' },
    ]},
    { id: 'production', icon: '🏭', label: '生产管理', children: [
        { id: 'production-order', label: '生产订单', page: 'production-order' },
        { id: 'production-task', label: '生产任务', page: 'production-task' },
        { id: 'work-report', label: '报工记录', page: 'work-report' },
        { id: 'work-bench', label: '报工工作台', page: 'work-bench' },
        { id: 'work-param', label: '报工参数', page: 'work-param' },
        { id: 'production-line', label: '生产线', page: 'production-line' },
    ]},
    { id: 'equipment', icon: '⚙️', label: '设备管理', children: [
        { id: 'equipment-list', label: '设备列表', page: 'equipment-list' },
        { id: 'equipment-repair', label: '设备报修', page: 'equipment-repair' },
        { id: 'repair-type', label: '维修类型', page: 'repair-type' },
    ]},
    { id: 'process', icon: '🔧', label: '工序管理', children: [
        { id: 'work-process', label: '工序列表', page: 'work-process' },
        { id: 'process-route', label: '工艺路线', page: 'process-route' },
        { id: 'work-process-type', label: '工序类型', page: 'work-process-type' },
        { id: 'process-route-type', label: '工艺路线类型', page: 'process-route-type' },
        { id: 'defect-reason', label: '不良原因', page: 'defect-reason' },
    ]},
    { id: 'maintenance', icon: '🛠️', label: '保养计划', children: [
        { id: 'maintenance-item', label: '保养项目', page: 'maintenance-item' },
        { id: 'maintenance-plan', label: '保养计划', page: 'maintenance-plan' },
        { id: 'inspection-item', label: '点检项目', page: 'inspection-item' },
        { id: 'inspection-plan', label: '点检计划', page: 'inspection-plan' },
        { id: 'maintenance-task', label: '任务处理', page: 'maintenance-task' },
    ]},
    { id: 'qc-setting', icon: '✅', label: '质检设置', children: [
        { id: 'qc-item', label: '检验项目', page: 'qc-item' },
        { id: 'qc-plan', label: '质检方案', page: 'qc-plan' },
    ]},
    { id: 'qc-task', icon: '🔍', label: '质检任务', children: [
        { id: 'qc-incoming', label: '来料检', page: 'qc-incoming' },
        { id: 'qc-outgoing', label: '出货检', page: 'qc-outgoing' },
        { id: 'qc-process', label: '过程检', page: 'qc-process' },
        { id: 'qc-finished', label: '成品入库检', page: 'qc-finished' },
        { id: 'qc-trace', label: '产品信息追溯', page: 'qc-trace' },
        { id: 'qc-batch', label: '批量质检统计', page: 'qc-batch' },
        { id: 'qc-single', label: '单独质检统计', page: 'qc-single' },
    ]},
    { id: 'inventory', icon: '📋', label: '库存管理', children: [
        { id: 'inv-stock', label: '库存查询', page: 'inv-stock' },
        { id: 'inv-in-list', label: '其他入库', page: 'inv-in-list' },
        { id: 'inv-out-list', label: '其他出库', page: 'inv-out-list' },
        { id: 'inv-sales-list', label: '销售出库', page: 'inv-sales-list' },
        { id: 'inv-alert', label: '库存预警', page: 'inv-alert' },
    ]},
    { id: 'energy', icon: '⚡', label: '能耗管理', children: [
        { id: 'energy-record', label: '能耗记录', page: 'energy-record' },
        { id: 'energy-price', label: '费用设置', page: 'energy-price' },
        { id: 'energy-initial', label: '初始能耗', page: 'energy-initial' },
    ]},
    { id: 'data-collect', icon: '📊', label: '数据采集', children: [
        { id: 'dc-group', label: '数据分组', page: 'dc-group' },
        { id: 'dc-standard', label: '数据管理', page: 'dc-standard' },
        { id: 'dc-record', label: '数据记录', page: 'dc-record' },
        { id: 'dc-feeding', label: '加料记录', page: 'dc-feeding' },
    ]},
    { id: 'system', icon: '⚙️', label: '系统管理', children: [
        { id: 'sys-employee', label: '员工管理', page: 'sys-employee' },
        { id: 'sys-role', label: '角色管理', page: 'sys-role' },
        { id: 'sys-dept', label: '部门管理', page: 'sys-dept' },
        { id: 'sys-log', label: '操作日志', page: 'sys-log' },
    ]},
];

// 页面配置：每个页面的表格列、搜索字段、按钮等
const PAGE_CONFIG = {
    // ===== 首页 =====
    'dashboard-overview': { type: 'dashboard' },
    'dashboard-notice': { type: 'table', title: '消息通知',
        search: [{ name: 'title', label: '消息标题', type: 'input' }, { name: 'type', label: '消息类型', type: 'select', options: ['全部','系统通知','生产提醒','设备告警','质检通知'] }],
        buttons: [{ text: '标记已读', type: 'primary', action: 'markRead' }, { text: '刷新', type: 'default', action: 'refresh' }],
        columns: [{ key: 'title', label: '消息标题' }, { key: 'type', label: '消息类型', type: 'tag' }, { key: 'content', label: '消息内容' }, { key: 'time', label: '发送时间' }, { key: 'status', label: '状态', type: 'tag' }, { key: 'action', label: '操作', width: 120 }],
        data: [
            { title: '生产订单即将到期', type: '生产提醒', content: '订单MO202601010001将于明日到期，请加快生产进度', time: '2026-01-05 09:00:00', status: '未读' },
            { title: '设备保养提醒', type: '设备告警', content: '空压机月度保养已逾期，请尽快安排', time: '2026-01-04 14:30:00', status: '未读' },
            { title: '来料检验完成', type: '质检通知', content: '批次IC20260101来料检验已完成，结果：合格', time: '2026-01-02 16:00:00', status: '已读' },
        ]
    },

    // ===== 产品管理 =====
    'product-list': { type: 'table', title: '产品管理', categorySidebar: true,
        search: [{ name: 'keyword', label: '', type: 'input', placeholder: '请输入产品名称或者编码搜索', singleSearch: true }],
        buttons: [{ text: '添加', type: 'primary', action: 'add' }, { text: '刷新', type: 'default', action: 'refresh' }, { text: '导出', type: 'default', action: 'export' }, { text: '导入', type: 'default', action: 'import' }, { text: '批量删除', type: 'danger', action: 'batchDelete' }],
        columns: [
            { key: 'checkbox', label: '', type: 'checkbox' },
            { key: 'code', label: '产品编码' },
            { key: 'name', label: '产品名称' },
            { key: 'type', label: '类型' },
            { key: 'spec', label: '规格' },
            { key: 'material', label: '材质' },
            { key: 'enabled', label: '启用状态', type: 'tag' },
            { key: 'remark', label: '备注' },
            { key: 'action', label: '操作', width: 180 }
        ],
        data: [
            { code: 'CJ003', name: '测试产品003', type: '半成品', spec: '', material: '', enabled: '启用', remark: '' },
            { code: 'CJ002', name: '测试产品2', type: '半成品', spec: '', material: '', enabled: '启用', remark: '' },
            { code: 'CP002', name: 'MR后轮毂', type: '半成品', spec: '', material: '', enabled: '启用', remark: '' },
            { code: 'YJ001', name: '脱脂剂', type: '原材料', spec: '', material: '', enabled: '启用', remark: '' },
            { code: 'CJ001', name: '测试产品1', type: '成品', spec: '', material: '', enabled: '启用', remark: '' },
            { code: 'JH1824A', name: '短片', type: '成品', spec: '', material: '', enabled: '启用', remark: '电泳产品' },
            { code: 'CP001', name: '汽车前保险杠', type: '成品', spec: '500×200×80mm', material: 'ABS塑料', enabled: '启用', remark: '' },
            { code: 'YL002', name: '固化剂', type: '原材料', spec: '20kg/桶', material: '化学制剂', enabled: '启用', remark: '' },
        ]
    },

    'product-type': { type: 'table', title: '产品类型',
        search: [{ name: 'parentType', label: '上级类别', type: 'select', options: ['全部','涂装件','冲压件','注塑件'] }, { name: 'name', label: '名称', type: 'input', placeholder: '类型名称' }],
        buttons: [{ text: '添加', type: 'primary', action: 'add' }, { text: '刷新', type: 'default', action: 'refresh' }],
        searchButtons: [{ text: '搜索', type: 'primary', action: 'search' }, { text: '重置', type: 'default', action: 'reset' }],
        columns: [{ key: 'name', label: '类型名称' }, { key: 'parentType', label: '上级类型' }, { key: 'action', label: '操作', width: 200 }],
        data: [
            { name: '涂装件', parentType: '-', },
            { name: '底漆涂装', parentType: '涂装件' },
            { name: '面漆涂装', parentType: '涂装件' },
            { name: '清漆涂装', parentType: '涂装件' },
            { name: '冲压件', parentType: '-' },
            { name: '注塑件', parentType: '-' },
            { name: '黑色注塑', parentType: '注塑件' },
            { name: '彩色注塑', parentType: '注塑件' },
            { name: '电镀件', parentType: '-' },
        ]
    },

    'customer': { type: 'table', title: '客户管理',
        search: [{ name: 'name', label: '客户名称', type: 'input', placeholder: '请输入客户名称' }],
        buttons: [{ text: '添加', type: 'primary', action: 'add' }, { text: '刷新', type: 'default', action: 'refresh' }],
        searchButtons: [{ text: '搜索', type: 'primary', action: 'search' }, { text: '重置', type: 'default', action: 'reset' }],
        columns: [{ key: 'name', label: '客户名称' }, { key: 'contact', label: '联系人' }, { key: 'phone', label: '联系电话' }, { key: 'address', label: '地址' }, { key: 'remark', label: '备注' }, { key: 'action', label: '操作', width: 200 }],
        data: [
            { name: '宁波汽配有限公司', contact: '张经理', phone: '13800138001', address: '宁波市鄞州区工业园区', remark: '长期合作客户' },
        ]
    },

    // ===== 生产管理 =====
    // ===== 生产订单：工序进度表格（14列完整字段，参照实际系统） =====
    'production-order': { type: 'custom', render: 'renderProductionOrderPage', title: '生产订单',
        // 顶部搜索条件（参照实际系统）
        search: [{ name: 'orderNo', label: '订单编号', type: 'input', placeholder: '请输入订单编号' }, { name: 'product', label: '产品', type: 'input', placeholder: '请输入产品' }, { name: 'creator', label: '创建人', type: 'input', placeholder: '请输入创建人' }, { name: 'type', label: '类型', type: 'select', options: ['全部','正常','返工'] }, { name: 'urgent', label: '是否加急', type: 'select', options: ['全部','是','否'] }, { name: 'finishStatus', label: '完成状态', type: 'select', options: ['全部','未完成','已完成'] }, { name: 'startDate', label: '开始时间', type: 'input', placeholder: 'YYYY-MM-DD' }, { name: 'endDate', label: '结束时间', type: 'input', placeholder: 'YYYY-MM-DD' }],
        buttons: [{ text: '添加', type: 'primary', action: 'add' }, { text: '刷新', type: 'default', action: 'refresh' }, { text: '导出', type: 'default', action: 'export' }, { text: '导入', type: 'default', action: 'import' }],
        searchButtons: [{ text: '搜索', type: 'primary', action: 'search' }, { text: '重置', type: 'default', action: 'reset' }],
        // 下拉选项（参照实际系统）
        customerOptions: ['杭州湾汽配','鼎结数智','赛亦信息','黑狐智造','宁波汽配','吉利汽车'],
        lineOptions: ['涂装1号线','涂装2号线','涂装3号线'],
        productOptions: ['管件(673351100A)','测试产品1(CJ001)','测试产品2(CJ002)','测试产品003(CJ003)','MR后轮毂(CP002)','短片(JH1824A)','钢丝支架(R003F716c)','拉杆(SFT-RLR80973)','脱脂剂(YJ001)','固化剂(YL002)'],
        ownerOptions: ['zty','张三','李四','王五'],
        routeOptions: ['电泳+喷粉','退漆+电泳（黑色）','来料检+电泳+成品检','打磨+喷涂+固化'],
        // 工单数据：14列完整字段
        data: [
            { id: 1, customerOrderNo: 'PO-2026-0001', orderNo: 'MO20260821001', productCode: 'YJ001', productName: '脱脂剂', quantity: 800, deliveryDate: '2026-08-30', urgent: '是', type: '正常', finishStatus: '未完成', route: '电泳+喷粉', creator: 'zty', createTime: '2026-08-21 09:30:00',
              qualified: 0, unqualified: 0, remark: '客户急单，优先安排',
              nodes: [
                  { name: '来料检验', pct: 100, planQty: 800, doneQty: 800, planStart: '2026-08-21', planEnd: '2026-08-21', actualStart: '2026-08-21', actualEnd: '2026-08-21', desc: '' },
                  { name: '上挂', pct: 100, planQty: 800, doneQty: 800, planStart: '2026-08-21', planEnd: '2026-08-22', actualStart: '2026-08-21', actualEnd: '2026-08-22', desc: '' },
                  { name: '电泳', pct: 29, planQty: 800, doneQty: 232, planStart: '2026-08-22', planEnd: '2026-08-25', actualStart: '2026-08-22', actualEnd: '', desc: '' },
                  { name: '喷粉', pct: 13, planQty: 800, doneQty: 100, planStart: '2026-08-25', planEnd: '2026-08-27', actualStart: '2026-08-25', actualEnd: '', desc: '' },
                  { name: '下挂', pct: 0, planQty: 800, doneQty: 0, planStart: '2026-08-27', planEnd: '2026-08-28', actualStart: '', actualEnd: '', desc: '' },
                  { name: '成品入库检', pct: 0, planQty: 800, doneQty: 0, planStart: '2026-08-28', planEnd: '2026-08-29', actualStart: '', actualEnd: '', desc: '' },
              ]},
            { id: 2, customerOrderNo: 'PO-2026-0002', orderNo: 'MO20260821002', productCode: 'R003F716c', productName: '钢丝支架', quantity: 1000, deliveryDate: '2026-09-05', urgent: '否', type: '正常', finishStatus: '未完成', route: '退漆+电泳（黑色）', creator: 'zty', createTime: '2026-08-21 10:15:00',
              qualified: 0, unqualified: 0, remark: '',
              nodes: [
                  { name: '来料检验', pct: 50, planQty: 1000, doneQty: 500, planStart: '2026-08-21', planEnd: '2026-08-22', actualStart: '2026-08-21', actualEnd: '', desc: '' },
                  { name: '上挂', pct: 0, planQty: 1000, doneQty: 0, planStart: '2026-08-22', planEnd: '2026-08-23', actualStart: '', actualEnd: '', desc: '' },
                  { name: '退漆', pct: 0, planQty: 1000, doneQty: 0, planStart: '2026-08-23', planEnd: '2026-08-25', actualStart: '', actualEnd: '', desc: '' },
                  { name: '电泳', pct: 0, planQty: 1000, doneQty: 0, planStart: '2026-08-25', planEnd: '2026-08-28', actualStart: '', actualEnd: '', desc: '' },
                  { name: '下挂', pct: 0, planQty: 1000, doneQty: 0, planStart: '2026-08-28', planEnd: '2026-08-29', actualStart: '', actualEnd: '', desc: '' },
                  { name: '成品入库检', pct: 0, planQty: 1000, doneQty: 0, planStart: '2026-08-29', planEnd: '2026-08-30', actualStart: '', actualEnd: '', desc: '' },
              ]},
            { id: 3, customerOrderNo: 'PO-2026-0003', orderNo: 'MO20260821003', productCode: 'CP002', productName: 'MR后轮毂', quantity: 500, deliveryDate: '2026-08-28', urgent: '否', type: '返工', finishStatus: '未完成', route: '打磨+喷涂+固化', creator: '张三', createTime: '2026-08-20 14:20:00',
              qualified: 120, unqualified: 8, remark: '客户退货返工，注意表面处理',
              nodes: [
                  { name: '打磨检', pct: 45, planQty: 500, doneQty: 225, planStart: '2026-08-20', planEnd: '2026-08-22', actualStart: '2026-08-20', actualEnd: '', desc: '表面打磨' },
                  { name: '做防涂', pct: 0, planQty: 500, doneQty: 0, planStart: '2026-08-22', planEnd: '2026-08-24', actualStart: '', actualEnd: '', desc: '' },
                  { name: '挂件检', pct: 0, planQty: 500, doneQty: 0, planStart: '2026-08-24', planEnd: '2026-08-25', actualStart: '', actualEnd: '', desc: '' },
                  { name: '喷涂', pct: 0, planQty: 500, doneQty: 0, planStart: '2026-08-25', planEnd: '2026-08-27', actualStart: '', actualEnd: '', desc: '' },
              ]},
            { id: 4, customerOrderNo: 'PO-2026-0004', orderNo: 'MO20260821004', productCode: 'JH1824A', productName: '短片', quantity: 2000, deliveryDate: '2026-08-25', urgent: '否', type: '正常', finishStatus: '已完成', route: '电泳+喷粉', creator: 'zty', createTime: '2026-08-15 09:00:00',
              qualified: 1990, unqualified: 10, remark: '电泳产品',
              nodes: [
                  { name: '来料检验', pct: 100, planQty: 2000, doneQty: 2000, planStart: '2026-08-15', planEnd: '2026-08-15', actualStart: '2026-08-15', actualEnd: '2026-08-15', desc: '' },
                  { name: '上挂', pct: 100, planQty: 2000, doneQty: 2000, planStart: '2026-08-16', planEnd: '2026-08-17', actualStart: '2026-08-16', actualEnd: '2026-08-17', desc: '' },
                  { name: '电泳', pct: 100, planQty: 2000, doneQty: 2000, planStart: '2026-08-17', planEnd: '2026-08-20', actualStart: '2026-08-17', actualEnd: '2026-08-20', desc: '' },
                  { name: '喷粉', pct: 100, planQty: 2000, doneQty: 2000, planStart: '2026-08-20', planEnd: '2026-08-22', actualStart: '2026-08-20', actualEnd: '2026-08-22', desc: '' },
                  { name: '下挂', pct: 100, planQty: 2000, doneQty: 2000, planStart: '2026-08-22', planEnd: '2026-08-23', actualStart: '2026-08-22', actualEnd: '2026-08-23', desc: '' },
                  { name: '成品入库检', pct: 100, planQty: 2000, doneQty: 2000, planStart: '2026-08-23', planEnd: '2026-08-24', actualStart: '2026-08-23', actualEnd: '2026-08-24', desc: '' },
              ]},
            { id: 5, customerOrderNo: 'PO-2026-0005', orderNo: 'MO20260821005', productCode: '673351100A', productName: '管件', quantity: 600, deliveryDate: '2026-09-10', urgent: '否', type: '正常', finishStatus: '未完成', route: '来料检+电泳+成品检', creator: '李四', createTime: '2026-08-19 16:45:00',
              qualified: 0, unqualified: 0, remark: '',
              nodes: [
                  { name: '来料检验', pct: 100, planQty: 600, doneQty: 600, planStart: '2026-08-19', planEnd: '2026-08-19', actualStart: '2026-08-19', actualEnd: '2026-08-19', desc: '' },
                  { name: '上挂', pct: 100, planQty: 600, doneQty: 600, planStart: '2026-08-20', planEnd: '2026-08-20', actualStart: '2026-08-20', actualEnd: '2026-08-20', desc: '' },
                  { name: '电泳', pct: 68, planQty: 600, doneQty: 408, planStart: '2026-08-21', planEnd: '2026-08-24', actualStart: '2026-08-21', actualEnd: '', desc: '' },
                  { name: '喷粉', pct: 0, planQty: 600, doneQty: 0, planStart: '2026-08-24', planEnd: '2026-08-26', actualStart: '', actualEnd: '', desc: '' },
                  { name: '成品入库检', pct: 0, planQty: 600, doneQty: 0, planStart: '2026-08-26', planEnd: '2026-08-27', actualStart: '', actualEnd: '', desc: '' },
                  { name: '打磨检', pct: 0, planQty: 600, doneQty: 0, planStart: '2026-08-27', planEnd: '2026-08-28', actualStart: '', actualEnd: '', desc: '' },
                  { name: '做防涂', pct: 0, planQty: 600, doneQty: 0, planStart: '2026-08-28', planEnd: '2026-08-29', actualStart: '', actualEnd: '', desc: '' },
              ]},
            { id: 6, customerOrderNo: 'PO-2026-0006', orderNo: 'MO20260821006', productCode: 'SFT-RLR80973', productName: '拉杆', quantity: 350, deliveryDate: '2026-09-02', urgent: '是', type: '返工', finishStatus: '未完成', route: '打磨+喷涂+固化', creator: '王五', createTime: '2026-08-18 11:30:00',
              qualified: 0, unqualified: 0, remark: '加急处理，表面划伤返工',
              nodes: [
                  { name: '来料检验', pct: 0, planQty: 350, doneQty: 0, planStart: '2026-08-22', planEnd: '2026-08-22', actualStart: '', actualEnd: '', desc: '' },
                  { name: '打磨检', pct: 0, planQty: 350, doneQty: 0, planStart: '2026-08-23', planEnd: '2026-08-24', actualStart: '', actualEnd: '', desc: '' },
                  { name: '成品入库检', pct: 0, planQty: 350, doneQty: 0, planStart: '2026-08-25', planEnd: '2026-08-26', actualStart: '', actualEnd: '', desc: '' },
                  { name: '上挂', pct: 0, planQty: 350, doneQty: 0, planStart: '2026-08-26', planEnd: '2026-08-27', actualStart: '', actualEnd: '', desc: '' },
              ]},
        ]
    },

    // 生产任务：字段与状态对齐真实系统（/admin/processTask/list）
    // 状态机: NOT_ASSIGNED未指派 → ASSIGNED已指派 → IN_PROGRESS进行中 ⇄ PAUSED已暂停 → COMPLETED已完成
    'production-task': { type: 'custom', render: 'renderProcessTaskPage', title: '生产任务',
        // 搜索区（参照实际系统：刷新 + 工序名称搜索 | 生产订单/产品/状态/创建时间范围 + 搜索/重置）
        search: [
            { name: 'keyword', label: '工序名称', type: 'input', placeholder: '请输入工序名称搜索' },
            { name: 'order', label: '生产订单', type: 'select', options: ['全部','MO20260821001','MO20260821002','MO20260821003','MO20260821005'] },
            { name: 'product', label: '产品', type: 'select', options: ['全部','脱脂剂(YJ001)','固化剂(YL002)','钢丝支架(R003F716c)','拉杆(SFT-RLR80973)'] },
            { name: 'status', label: '状态', type: 'select', options: ['全部','未指派','已指派','进行中','已暂停','已完成'] },
            { name: 'startDate', label: '创建时间', type: 'input', placeholder: 'YYYY-MM-DD' },
            { name: 'endDate', label: '至', type: 'input', placeholder: 'YYYY-MM-DD' },
        ],
        buttons: [{ text: '刷新', type: 'default', action: 'refresh' }],
        searchButtons: [{ text: '搜索', type: 'primary', action: 'search' }, { text: '重置', type: 'default', action: 'reset' }],
        // 状态值映射（真实系统 status → 中文显示）
        statusMap: { 'NOT_ASSIGNED': '未指派', 'ASSIGNED': '已指派', 'IN_PROGRESS': '进行中', 'PAUSED': '已暂停', 'COMPLETED': '已完成' },
        // 指派人员下拉（真实系统 /admin/admin/simpleList）
        workerOptions: ['zty','张三','李四','王五','456'],
        // 13列任务数据（字段对齐真实接口返回）
        data: [
            { id: 401, productionOrderSn: 'MO20260821001', productCode: 'YJ001', productName: '脱脂剂', processName: '来料检验', description: '按检验标准抽检来料', quantity: 800, completedQuantity: 800, status: 'COMPLETED', assignedWorkerName: 'zty', customerOrderNo: 'PO-2026-0001', partnerName: '杭州湾汽配', deliveryDate: '2026-08-30', createTime: '2026-08-21 09:35:00', plannedStartDate: '2026-08-21', plannedEndDate: '2026-08-21', actualStartDate: '2026-08-21', actualEndDate: '2026-08-21', processGuideFilePath: '' },
            { id: 402, productionOrderSn: 'MO20260821001', productCode: 'YJ001', productName: '脱脂剂', processName: '上挂', description: '工件上挂具，注意间距', quantity: 800, completedQuantity: 800, status: 'COMPLETED', assignedWorkerName: '张三', customerOrderNo: 'PO-2026-0001', partnerName: '杭州湾汽配', deliveryDate: '2026-08-30', createTime: '2026-08-21 09:35:00', plannedStartDate: '2026-08-21', plannedEndDate: '2026-08-22', actualStartDate: '2026-08-21', actualEndDate: '2026-08-22', processGuideFilePath: '' },
            { id: 403, productionOrderSn: 'MO20260821002', productCode: 'YL002', productName: '固化剂', processName: '电泳', description: '电泳槽参数：电压180V，时间3min', quantity: 500, completedQuantity: 145, status: 'IN_PROGRESS', assignedWorkerName: '李四', customerOrderNo: 'PO-2026-0002', partnerName: '赛亦信息', deliveryDate: '2026-09-02', createTime: '2026-08-21 10:02:00', plannedStartDate: '2026-08-22', plannedEndDate: '2026-08-25', actualStartDate: '2026-08-22', actualEndDate: '', processGuideFilePath: '/files/guide/dianyong.pdf' },
            { id: 404, productionOrderSn: 'MO20260821002', productCode: 'YL002', productName: '固化剂', processName: '喷粉', description: '静电喷粉，膜厚60-80μm', quantity: 500, completedQuantity: 0, status: 'ASSIGNED', assignedWorkerName: '王五', customerOrderNo: 'PO-2026-0002', partnerName: '赛亦信息', deliveryDate: '2026-09-02', createTime: '2026-08-21 10:02:00', plannedStartDate: '2026-08-25', plannedEndDate: '2026-08-27', actualStartDate: '', actualEndDate: '', processGuideFilePath: '' },
            { id: 405, productionOrderSn: 'MO20260821003', productCode: 'R003F716c', productName: '钢丝支架', processName: '电泳', description: '返工件先打磨再电泳', quantity: 300, completedQuantity: 96, status: 'PAUSED', assignedWorkerName: '456', customerOrderNo: 'PO-2026-0003', partnerName: '黑狐智造', deliveryDate: '2026-09-05', createTime: '2026-08-21 14:20:00', plannedStartDate: '2026-08-22', plannedEndDate: '2026-08-24', actualStartDate: '2026-08-22', actualEndDate: '', processGuideFilePath: '' },
            { id: 406, productionOrderSn: 'MO20260821005', productCode: 'SFT-RLR80973', productName: '拉杆', processName: '来料检验', description: '', quantity: 600, completedQuantity: 0, status: 'NOT_ASSIGNED', assignedWorkerName: '', customerOrderNo: 'PO-2026-0005', partnerName: '宁波汽配', deliveryDate: '2026-09-10', createTime: '2026-08-21 17:16:00', plannedStartDate: '', plannedEndDate: '', actualStartDate: '', actualEndDate: '', processGuideFilePath: '' },
            { id: 407, productionOrderSn: 'MO20260821005', productCode: 'SFT-RLR80973', productName: '拉杆', processName: '上挂', description: '', quantity: 600, completedQuantity: 0, status: 'NOT_ASSIGNED', assignedWorkerName: '', customerOrderNo: 'PO-2026-0005', partnerName: '宁波汽配', deliveryDate: '2026-09-10', createTime: '2026-08-21 17:16:00', plannedStartDate: '', plannedEndDate: '', actualStartDate: '', actualEndDate: '', processGuideFilePath: '' },
        ]
    },

    // 报工记录：字段对齐真实系统（/workReport/list + workReport/view）
    'work-report': { type: 'custom', render: 'renderWorkReportPage', title: '报工记录',
        search: [
            { name: 'processName', label: '工序名称', type: 'input', placeholder: '请输入工序名称' },
            { name: 'orderNo', label: '生产订单', type: 'select', options: ['全部','MO20260821001','MO20260821002','MO20260821003','MO20260821005'] },
            { name: 'product', label: '产品', type: 'select', options: ['全部','脱脂剂(YJ001)','固化剂(YL002)','钢丝支架(R003F716c)','拉杆(SFT-RLR80973)'] },
            { name: 'reporter', label: '报工人员', type: 'select', options: ['全部','zty','张三','李四','王五','456'] },
            { name: 'startDate', label: '报工时间', type: 'input', placeholder: 'YYYY-MM-DD' },
            { name: 'endDate', label: '至', type: 'input', placeholder: 'YYYY-MM-DD' },
        ],
        buttons: [{ text: '刷新', type: 'default', action: 'refresh' }],
        searchButtons: [{ text: '搜索', type: 'primary', action: 'search' }, { text: '重置', type: 'default', action: 'reset' }],
        // 工序参数类型映射（查看页展示用）
        paramTypeMap: { 'TEXT': '文本', 'NUMERIC': '数值', 'BOOLEAN': '开关' },
        data: [
            { id: 501, orderNo: 'MO20260821001', product: '脱脂剂', processName: '来料检验', reporter: 'zty', completedQty: 400, defectQty: 0, reportTime: '2026-08-21 18:00:00', defectReason: '', remark: '抽检30件全合格', createTime: '2026-08-21 18:02:00',
              params: [ { name: '抽检比例', type: 'NUMERIC', value: '30', unit: '%' }, { name: '外观检查项', type: 'TEXT', value: '无划伤、无色差、无变形' } ] },
            { id: 502, orderNo: 'MO20260821001', product: '脱脂剂', processName: '上挂', reporter: '张三', completedQty: 350, defectQty: 2, reportTime: '2026-08-22 10:30:00', defectReason: '挂具松动脱落', remark: '', createTime: '2026-08-22 10:32:00',
              params: [ { name: '挂具间距', type: 'NUMERIC', value: '15', unit: 'cm' } ] },
            { id: 503, orderNo: 'MO20260821002', product: '固化剂', processName: '电泳', reporter: '李四', completedQty: 145, defectQty: 3, reportTime: '2026-08-22 14:20:00', defectReason: '膜厚不均', remark: '第2槽电压波动', createTime: '2026-08-22 14:25:00',
              params: [ { name: '电泳电压', type: 'NUMERIC', value: '180', unit: 'V' }, { name: '电泳时间', type: 'NUMERIC', value: '3', unit: 'min' }, { name: '槽液温度', type: 'NUMERIC', value: '28.5', unit: '℃' }, { name: '异常记录', type: 'TEXT', value: '电压波动已通知设备组' } ] },
            { id: 504, orderNo: 'MO20260821003', product: '钢丝支架', processName: '电泳', reporter: '456', completedQty: 96, defectQty: 1, defectReason: '返工件锈点', reportTime: '2026-08-22 16:00:00', remark: '返工件单独挂具', createTime: '2026-08-22 16:05:00',
              params: [ { name: '电泳电压', type: 'NUMERIC', value: '175', unit: 'V' } ] },
        ]
    },

    // 报工工作台：左侧记录列表 + 右侧参数表单（对齐真实系统 WorkReportPlatform）
    'work-bench': { type: 'custom', title: '报工工作台',
        render: 'renderWorkBench',
        // 工单选项 → 各工单的工序及工序参数定义
        workOrders: [
            { id: 'MO20260821002', product: '固化剂', processes: [
                { name: '电泳', params: [ { name: '电泳电压', type: 'NUMERIC', unit: 'V', required: true, desc: '范围160-200V' }, { name: '电泳时间', type: 'NUMERIC', unit: 'min', required: true }, { name: '槽液温度', type: 'NUMERIC', unit: '℃', required: false }, { name: '异常记录', type: 'TEXT', required: false } ] },
                { name: '喷粉', params: [ { name: '静电电压', type: 'NUMERIC', unit: 'kV', required: true }, { name: '膜厚', type: 'NUMERIC', unit: 'μm', required: true }, { name: '喷房温度', type: 'NUMERIC', unit: '℃', required: false } ] },
            ]},
            { id: 'MO20260821001', product: '脱脂剂', processes: [
                { name: '来料检验', params: [ { name: '抽检比例', type: 'NUMERIC', unit: '%', required: true }, { name: '外观检查项', type: 'TEXT', required: false } ] },
                { name: '上挂', params: [ { name: '挂具间距', type: 'NUMERIC', unit: 'cm', required: true }, { name: '首件确认', type: 'BOOLEAN', required: true, desc: '首件合格后开启' } ] },
                { name: '喷粉', params: [ { name: '膜厚', type: 'NUMERIC', unit: 'μm', required: true } ] },
            ]},
            { id: 'MO20260821005', product: '拉杆', processes: [
                { name: '来料检验', params: [ { name: '抽检比例', type: 'NUMERIC', unit: '%', required: true } ] },
                { name: '上挂', params: [ { name: '挂具间距', type: 'NUMERIC', unit: 'cm', required: true } ] },
            ]},
        ],
        workerOptions: ['zty','张三','李四','王五','456'],
        defectTypeOptions: ['表面划伤','色差','膜厚不均','挂具松动脱落','锈点','变形','杂质颗粒'],
    },

    'work-param': { type: 'table', title: '报工参数',
        search: [{ name: 'name', label: '参数名称', type: 'input' }],
        buttons: [{ text: '新增', type: 'primary', action: 'add' }, { text: '刷新', type: 'default', action: 'refresh' }],
        columns: [{ key: 'name', label: '参数名称' }, { key: 'code', label: '参数编码' }, { key: 'type', label: '参数类型' }, { key: 'unit', label: '单位' }, { key: 'remark', label: '备注' }, { key: 'action', label: '操作', width: 200 }],
        data: [
            { name: '标准工时', code: 'STD_TIME', type: '数值', unit: '分钟', remark: '单件标准加工时间' },
            { name: '标准产能', code: 'STD_CAP', type: '数值', unit: '件/小时', remark: '每小时标准产能' },
            { name: '不良率上限', code: 'DEFECT_LIMIT', type: '百分比', unit: '%', remark: '不良率告警阈值' },
        ]
    },

    'production-line': { type: 'table', title: '生产线',
        search: [{ name: 'name', label: '产线名称', type: 'input' }],
        buttons: [{ text: '添加', type: 'primary', action: 'add' }, { text: '刷新', type: 'default', action: 'refresh' }],
        columns: [{ key: 'name', label: '产线名称' }, { key: 'desc', label: '产线描述' }, { key: 'enabled', label: '是否启用', type: 'tag' }, { key: 'action', label: '操作', width: 200 }],
        data: [
            { name: '涂装一线', desc: '自动喷涂产线A', enabled: '启用' },
            { name: '涂装二线', desc: '自动喷涂产线B', enabled: '启用' },
            { name: '前处理线', desc: '前处理清洗产线', enabled: '启用' },
            { name: '包装线', desc: '成品包装产线', enabled: '启用' },
        ]
    },

    // ===== 设备管理 =====
    'equipment-list': { type: 'table', title: '设备列表',
        search: [{ name: 'line', label: '生产线', type: 'select', options: ['全部','涂装测试生产线','涂装2号线','3323号产线'] }, { name: 'name', label: '设备名称', type: 'input' }],
        buttons: [{ text: '添加', type: 'primary', action: 'add' }, { text: '刷新', type: 'default', action: 'refresh' }, { text: '导出', type: 'default', action: 'export' }, { text: '导入', type: 'default', action: 'import' }],
        columns: [{ key: 'code', label: '设备编码' }, { key: 'name', label: '设备名称' }, { key: 'model', label: '型号' }, { key: 'manufacturer', label: '制造厂商' }, { key: 'status', label: '状态', type: 'tag' }, { key: 'remark', label: '备注' }, { key: 'action', label: '操作', width: 160 }],
        // 详情弹窗展示的全部字段（与参考系统 /equipment/view 一致）
        detailFields: [
            ['code', '设备编码'], ['name', '设备名称'], ['model', '设备型号'], ['manufacturer', '制造厂商'],
            ['factoryNo', '出厂编号'], ['purchaseDate', '采购日期'], ['price', '采购价格（元）'], ['owner', '设备负责人'],
            ['location', '安装位置'], ['status', '设备状态'], ['line', '所属产线'], ['techParam', '技术参数'], ['remark', '备注'],
        ],
        data: [
            { code: 'EQ001', name: '前处理清洗机', model: 'QX-3000', manufacturer: '海纳环保设备', factoryNo: 'FC20230001', purchaseDate: '2023-03-15', price: 185000, owner: '张三', location: '前处理车间1号工位', status: '启用', line: '涂装测试生产线', techParam: '处理能力3t/h，功率22kW，电压380V', remark: '主脱脂槽配套设备' },
            { code: 'EQ002', name: '静电喷涂机', model: 'PD-800', manufacturer: '中涂智能装备', factoryNo: 'FC20230042', purchaseDate: '2023-05-20', price: 268000, owner: '李四', location: '喷涂车间2号工位', status: '启用', line: '涂装测试生产线', techParam: '输出电压0-100kV，出粉量300g/min', remark: '定期校准静电参数' },
            { code: 'EQ003', name: '固化炉', model: 'GH-4500', manufacturer: '北方机械制造', factoryNo: 'FC20220018', purchaseDate: '2022-08-10', price: 520000, owner: '王五', location: '固化车间', status: '维修中', line: '涂装2号线', techParam: '最高温度220℃，加热功率120kW', remark: '加热模块故障，维修中' },
            { code: 'EQ004', name: '悬挂输送链', model: 'XS-600', manufacturer: '顺达输送设备', factoryNo: 'FC20220033', purchaseDate: '2022-09-28', price: 340000, owner: '张三', location: '全线贯通', status: '启用', line: '涂装2号线', techParam: '链速0-3m/min可调，节距150mm', remark: '' },
            { code: 'EQ005', name: '螺杆空压机', model: 'LG-10A', manufacturer: '阿特拉斯·科普柯', factoryNo: 'FC20210007', purchaseDate: '2021-06-18', price: 96000, owner: '赵六', location: '动力房', status: '停用', line: '3323号产线', techParam: '排气量1.6m³/min，压力0.8MPa', remark: '备用机组，待检修' },
            { code: 'EQ006', name: '烘干室', model: 'HG-200', manufacturer: '中涂智能装备', factoryNo: 'FC20240012', purchaseDate: '2024-02-25', price: 158000, owner: '李四', location: '后段车间', status: '报废', line: '3323号产线', techParam: '工作温度80-150℃，循环风机2台', remark: '箱体锈蚀严重，已报废处理' },
        ]
    },

    'equipment-repair': { type: 'table', title: '设备报修',
        search: [
            { name: 'equipment', label: '设备', type: 'input' },
            { name: 'status', label: '状态', type: 'select', options: ['全部','未分配维修人','计划中','进行中','已完成','已取消'] },
        ],
        buttons: [{ text: '添加', type: 'primary', action: 'add' }, { text: '刷新', type: 'default', action: 'refresh' }, { text: '导出', type: 'default', action: 'export' }],
        columns: [
            { key: 'repairNo', label: '维修单号', width: 150 }, { key: 'equipment', label: '设备' }, { key: 'repairType', label: '维修类型' },
            { key: 'urgent', label: '紧急', type: 'tag' }, { key: 'faultTime', label: '故障时间', width: 150 }, { key: 'faultDesc', label: '故障描述' },
            { key: 'reporter', label: '报修人' }, { key: 'assignee', label: '指派给' }, { key: 'status', label: '状态', type: 'tag' },
            { key: 'createTime', label: '创建时间', width: 150 }, { key: 'action', label: '操作', width: 220 },
        ],
        // 详情弹窗展示的全部字段（与参考系统表单字段一致）
        detailFields: [
            ['repairNo', '维修单号'], ['equipment', '设备'], ['repairType', '维修类型'], ['urgent', '紧急程度'],
            ['faultTime', '故障时间'], ['faultPart', '设备部位'], ['faultDesc', '故障描述'], ['reporter', '报修人'],
            ['phone', '联系方式'], ['assignee', '指派给'], ['status', '状态'], ['createTime', '创建时间'], ['remark', '备注'],
        ],
        data: [
            { repairNo: 'RP20260101001', equipment: '固化炉', repairType: '机械维修', urgent: '紧急', faultTime: '2026-01-02 08:30', faultPart: '加热模块', faultDesc: '升温异常，炉温无法达到设定值', reporter: '张三', phone: '13800000001', assignee: '王五', status: '进行中', createTime: '2026-01-02 09:00:00', remark: '已更换加热管，待测试' },
            { repairNo: 'RP20260105002', equipment: '静电喷涂机', repairType: '电气维修', urgent: '一般', faultTime: '2026-01-05 14:20', faultPart: '静电发生器', faultDesc: '静电电压不稳定，出粉不均', reporter: '李四', phone: '13800000002', assignee: '赵六', status: '计划中', createTime: '2026-01-05 14:35:00', remark: '预约明日上门检修' },
            { repairNo: 'RP20260108003', equipment: '螺杆空压机', repairType: '保养维护', urgent: '一般', faultTime: '2026-01-08 10:00', faultPart: '整机', faultDesc: '排气压力偏低，需检查滤芯', reporter: '赵六', phone: '13800000003', assignee: '', status: '未分配维修人', createTime: '2026-01-08 10:15:00', remark: '' },
            { repairNo: 'RP20260110004', equipment: '悬挂输送链', repairType: '机械维修', urgent: '紧急', faultTime: '2026-01-10 16:40', faultPart: '链条传动段', faultDesc: '异响明显，链条跳动', reporter: '王五', phone: '13800000004', assignee: '张三', status: '已完成', createTime: '2026-01-10 16:50:00', remark: '已更换托轮并润滑' },
            { repairNo: 'RP20260112005', equipment: '前处理清洗机', repairType: '管道疏通', urgent: '一般', faultTime: '2026-01-12 09:10', faultPart: '喷淋管路', faultDesc: '喷嘴堵塞，喷淋压力不足', reporter: '张三', phone: '13800000005', assignee: '', status: '已取消', createTime: '2026-01-12 09:30:00', remark: '现场自行处理，取消工单' },
        ]
    },

    'repair-type': { type: 'table', title: '维修类型',
        buttons: [{ text: '添加', type: 'primary', action: 'add' }, { text: '刷新', type: 'default', action: 'refresh' }],
        columns: [{ key: 'typeName', label: '维修类型名称' }, { key: 'createTime', label: '创建时间', width: 200 }, { key: 'action', label: '操作', width: 160 }],
        data: [
            { typeName: '机械维修', createTime: '2025-06-01 10:00:00' },
            { typeName: '电气维修', createTime: '2025-06-01 10:05:00' },
            { typeName: '保养维护', createTime: '2025-06-05 14:20:00' },
            { typeName: '管道疏通', createTime: '2025-07-12 09:40:00' },
        ]
    },

    // ===== 工序管理（5个子模块，对齐真实系统） =====
    // 工序列表
    'work-process': { type: 'table', title: '工序列表',
        search: [{ name: 'name', label: '工序名称', type: 'input' }],
        buttons: [{ text: '添加', type: 'primary', action: 'add' }, { text: '刷新', type: 'default', action: 'refresh' }, { text: '导出', type: 'default', action: 'export' }, { text: '导入', type: 'default', action: 'import' }],
        columns: [{ key: 'code', label: '工序编码', width: 110 }, { key: 'name', label: '工序名称' }, { key: 'desc', label: '工序描述' }, { key: 'status', label: '状态', type: 'tag' }, { key: 'type', label: '工序类型' }, { key: 'remark', label: '备注' }, { key: 'action', label: '操作', width: 160 }],
        detailFields: [['code', '工序编码'], ['name', '工序名称'], ['desc', '工序描述'], ['status', '状态'], ['type', '工序类型'], ['attachment', '附件'], ['remark', '备注']],
        data: [
            { code: 'WP001', name: '前处理', desc: '脱脂、水洗、表调、磷化', status: '启用', type: '标准', attachment: '-', remark: '' },
            { code: 'WP002', name: '底漆喷涂', desc: '底漆静电喷涂，膜厚15-20μm', status: '启用', type: '标准', attachment: 'SOP-WP-002.pdf', remark: '' },
            { code: 'WP003', name: '面漆喷涂', desc: '面漆喷涂，颜色按订单要求', status: '启用', type: '标准', attachment: 'SOP-WP-003.pdf', remark: '色差敏感工序' },
            { code: 'WP004', name: '固化烘烤', desc: '180℃高温固化30分钟', status: '启用', type: '标准', attachment: '-', remark: '' },
            { code: 'WP005', name: '冷却检验', desc: '自然冷却后外观及膜厚检验', status: '启用', type: '质检', attachment: 'SOP-WP-005.pdf', remark: '' },
            { code: 'WP006', name: '包装入库', desc: '包装并扫码入库', status: '启用', type: '标准', attachment: '-', remark: '' },
            { code: 'WP007', name: '返修打磨', desc: '不良品打磨返修', status: '停用', type: '非标准', attachment: '-', remark: '暂停使用' },
        ]
    },

    // 工艺路线
    'process-route': { type: 'table', title: '工艺路线',
        search: [
            { name: 'creator', label: '创建人', type: 'select', options: ['全部','管理员','张三','李四'] },
            { name: 'name', label: '路线名称', type: 'input' },
        ],
        buttons: [{ text: '添加', type: 'primary', action: 'add' }, { text: '刷新', type: 'default', action: 'refresh' }],
        columns: [{ key: 'name', label: '名称' }, { key: 'creator', label: '创建人' }, { key: 'createTime', label: '创建时间', width: 170 }, { key: 'remark', label: '备注' }, { key: 'action', label: '操作', width: 160 }],
        // 处理方式选项（选择报工/质检类型）
        handleTypeOptions: ['普通工序', '报工工序', '过程检', '来料检', '成品入库检', '销售出货检'],
        // 质检类处理方式（选择这些时才启用质检方案）
        qcHandleTypes: ['过程检', '来料检', '成品入库检', '销售出货检'],
        qcPlanOptions: ['外观检验方案', '尺寸检验方案', '膜厚检验方案', '附着力检验方案', '综合检验方案'],
        data: [
            { name: '保险杠标准喷涂路线', creator: '管理员', createTime: '2026-01-05 10:00:00', category: '标准工艺', remark: '适用于汽车保险杠类产品', steps: [
                { name: '前处理', guide: 'SOP-WP-001.pdf', instruction: '按脱脂→水洗→表调→磷化顺序执行', handleType: '普通工序', qcPlan: '', autoIn: false },
                { name: '底漆喷涂', guide: 'SOP-WP-002.pdf', instruction: '静电喷涂，膜厚15-20μm', handleType: '报工工序', qcPlan: '', autoIn: false },
                { name: '面漆喷涂', guide: 'SOP-WP-003.pdf', instruction: '按订单颜色喷涂，换色需清洗管路', handleType: '报工工序', qcPlan: '', autoIn: false },
                { name: '固化烘烤', guide: '-', instruction: '180℃×30min', handleType: '普通工序', qcPlan: '', autoIn: false },
                { name: '冷却检验', guide: 'SOP-WP-005.pdf', instruction: '冷却后全检外观与膜厚', handleType: '成品入库检', qcPlan: '综合检验方案', autoIn: false },
                { name: '包装入库', guide: '-', instruction: '包装后扫码入库', handleType: '普通工序', qcPlan: '', autoIn: true },
            ]},
            { name: '饰条返修路线', creator: '张三', createTime: '2026-01-12 14:30:00', category: '返修工艺', remark: '不良品返修处理', steps: [
                { name: '返修打磨', guide: '-', instruction: '打磨至露底，清除缺陷', handleType: '普通工序', qcPlan: '', autoIn: false },
                { name: '面漆喷涂', guide: 'SOP-WP-003.pdf', instruction: '重喷面漆', handleType: '报工工序', qcPlan: '', autoIn: false },
                { name: '冷却检验', guide: 'SOP-WP-005.pdf', instruction: '重点检验返修区域', handleType: '过程检', qcPlan: '外观检验方案', autoIn: false },
            ]},
            { name: '新件试制路线', creator: '李四', createTime: '2026-02-01 09:15:00', category: '试制工艺', remark: '新品试制验证', steps: [
                { name: '前处理', guide: 'SOP-WP-001.pdf', instruction: '小批量手动处理', handleType: '普通工序', qcPlan: '', autoIn: false },
                { name: '面漆喷涂', guide: 'SOP-WP-003.pdf', instruction: '试喷样件', handleType: '报工工序', qcPlan: '', autoIn: false },
                { name: '冷却检验', guide: 'SOP-WP-005.pdf', instruction: '全尺寸检测', handleType: '过程检', qcPlan: '尺寸检验方案', autoIn: false },
            ]},
        ]
    },

    // 工序类型
    'work-process-type': { type: 'table', title: '工序类型',
        search: [{ name: 'name', label: '类型名称', type: 'input' }],
        buttons: [{ text: '添加', type: 'primary', action: 'add' }, { text: '刷新', type: 'default', action: 'refresh' }],
        columns: [{ key: 'code', label: '类型编码', width: 110 }, { key: 'name', label: '类型名称' }, { key: 'desc', label: '类型描述' }, { key: 'status', label: '状态', type: 'tag' }, { key: 'remark', label: '备注' }, { key: 'action', label: '操作', width: 160 }],
        detailFields: [['code', '类型编码'], ['name', '类型名称'], ['desc', '类型描述'], ['status', '状态'], ['remark', '备注']],
        data: [
            { code: 'PT001', name: '标准', desc: '标准生产工序', status: '启用', remark: '' },
            { code: 'PT002', name: '非标准', desc: '非标准/临时工序', status: '启用', remark: '' },
            { code: 'PT003', name: '质检', desc: '质量检验工序', status: '启用', remark: '' },
            { code: 'PT004', name: '辅助', desc: '辅助支撑工序', status: '停用', remark: '暂停使用' },
        ]
    },

    // 工艺路线类型
    'process-route-type': { type: 'table', title: '工艺路线类型',
        buttons: [{ text: '添加', type: 'primary', action: 'add' }, { text: '刷新', type: 'default', action: 'refresh' }],
        columns: [{ key: 'typeName', label: '类型名称' }, { key: 'remark', label: '备注' }, { key: 'createTime', label: '创建时间', width: 200 }, { key: 'action', label: '操作', width: 160 }],
        detailFields: [['typeName', '类型名称'], ['remark', '备注'], ['createTime', '创建时间']],
        data: [
            { typeName: '标准工艺', remark: '常规量产工艺', createTime: '2025-06-01 10:00:00' },
            { typeName: '特殊工艺', remark: '特殊要求工艺', createTime: '2025-06-01 10:05:00' },
            { typeName: '试制工艺', remark: '新品试制', createTime: '2025-07-12 09:40:00' },
            { typeName: '返修工艺', remark: '不良品返修', createTime: '2025-08-20 15:20:00' },
            { typeName: '外协工艺', remark: '委外加工', createTime: '2025-09-15 11:30:00' },
        ]
    },

    // 不良原因（选项与报工工作台不良品项一致）
    'defect-reason': { type: 'table', title: '不良原因',
        search: [{ name: 'name', label: '不良原因名称', type: 'input' }],
        buttons: [{ text: '添加', type: 'primary', action: 'add' }, { text: '刷新', type: 'default', action: 'refresh' }],
        columns: [{ key: 'name', label: '不良原因名称' }, { key: 'desc', label: '描述' }, { key: 'action', label: '操作', width: 160 }],
        detailFields: [['name', '不良原因名称'], ['desc', '描述']],
        data: [
            { name: '表面划伤', desc: '工件表面划伤、碰伤' },
            { name: '色差', desc: '喷涂颜色与标准色板偏差' },
            { name: '膜厚不均', desc: '漆膜厚度超出工艺范围' },
            { name: '挂具松动脱落', desc: '悬挂输送过程中脱落' },
            { name: '锈点', desc: '前处理不彻底产生的锈迹' },
            { name: '变形', desc: '工件结构变形' },
            { name: '杂质颗粒', desc: '漆膜表面颗粒杂质' },
        ]
    },

    // ===== 保养计划模块（5个子模块，对齐真实系统） =====
    // 保养项目
    'maintenance-item': { type: 'table', title: '保养项目',
        search: [{ name: 'name', label: '关键字', type: 'input', placeholder: '输入关键字搜索' }, { name: 'status', label: '启用状态', type: 'select', options: ['全部','启用','禁用'] }],
        buttons: [{ text: '新增保养项', type: 'primary', action: 'add' }, { text: '刷新', type: 'default', action: 'refresh' }],
        columns: [{ key: 'code', label: '保养项编码', width: 130 }, { key: 'name', label: '保养项名称' }, { key: 'status', label: '启用状态', type: 'tag' }, { key: 'action', label: '操作', width: 160 }],
        detailFields: [['code', '保养项编码'], ['name', '保养项名称'], ['desc', '描述'], ['status', '启用状态']],
        data: [
            { code: 'MI001', name: '更换润滑油', desc: '更换设备润滑油至标准油位', status: '启用' },
            { code: 'MI002', name: '更换滤芯', desc: '更换进油/进气滤芯', status: '启用' },
            { code: 'MI003', name: '传动链润滑', desc: '链条涂抹润滑脂', status: '启用' },
            { code: 'MI004', name: '紧固件检查', desc: '检查并紧固各连接螺栓', status: '启用' },
            { code: 'MI005', name: '清理积尘', desc: '清理电气柜及机身积尘', status: '启用' },
            { code: 'MI006', name: '加热管更换', desc: '更换老化加热管', status: '禁用' },
        ]
    },

    // 保养计划（明细关联保养项目，保存后自动生成保养任务）
    'maintenance-plan': { type: 'table', title: '保养计划',
        search: [{ name: 'equipment', label: '设备', type: 'input' }, { name: 'responsible', label: '负责人', type: 'input' }, { name: 'planName', label: '计划名称', type: 'input' }, { name: 'createTime', label: '创建时间', type: 'input', placeholder: 'YYYY-MM-DD ~ YYYY-MM-DD' }],
        buttons: [{ text: '新增', type: 'primary', action: 'add' }, { text: '刷新', type: 'default', action: 'refresh' }],
        columns: [{ key: 'equipment', label: '设备名称' }, { key: 'planName', label: '计划名称' }, { key: 'responsible', label: '负责人' }, { key: 'planStart', label: '计划开始时间', width: 110 }, { key: 'planEnd', label: '计划结束时间', width: 110 }, { key: 'status', label: '状态', type: 'tag' }, { key: 'remark', label: '备注' }, { key: 'createTime', label: '创建时间', width: 160 }, { key: 'action', label: '操作', width: 160 }],
        // 计划类型标识：保养（用于任务生成与文案）
        planKind: '保养',
        itemSourcePage: 'maintenance-item',
        itemColumnLabel: '保养项名称',
        data: [
            { equipment: '固化炉', planName: '固化炉月度保养', responsible: '王五', planCode: 'MP20260101', planStart: '2026-01-20', planEnd: '2026-01-21', cycle: 1, cycleUnit: '月', status: '计划中', remark: '加热系统月度保养', createTime: '2026-01-05 10:00:00', items: [
                { name: '加热管更换', remark: '检查加热管老化情况' }, { name: '紧固件检查', remark: '' }, { name: '清理积尘', remark: '电气柜除尘' },
            ]},
            { equipment: '螺杆空压机', planName: '空压机季度保养', responsible: '赵六', planCode: 'MP20260102', planStart: '2026-02-10', planEnd: '2026-02-10', cycle: 3, cycleUnit: '月', status: '计划中', remark: '常规季度保养', createTime: '2026-01-12 14:00:00', items: [
                { name: '更换润滑油', remark: '' }, { name: '更换滤芯', remark: '进气滤芯' }, { name: '紧固件检查', remark: '' },
            ]},
            { equipment: '悬挂输送链', planName: '输送链周保养', responsible: '张三', planCode: 'MP20260103', planStart: '2026-01-18', planEnd: '2026-01-18', cycle: 1, cycleUnit: '周', status: '计划中', remark: '链条润滑保养', createTime: '2026-01-10 09:00:00', items: [
                { name: '传动链润滑', remark: '全程润滑' }, { name: '紧固件检查', remark: '' },
            ]},
        ]
    },

    // 点检项目
    'inspection-item': { type: 'table', title: '点检项目',
        search: [{ name: 'name', label: '关键字', type: 'input', placeholder: '输入关键字搜索' }, { name: 'status', label: '启用状态', type: 'select', options: ['全部','启用','禁用'] }],
        buttons: [{ text: '新增点检项', type: 'primary', action: 'add' }, { text: '刷新', type: 'default', action: 'refresh' }],
        columns: [{ key: 'code', label: '点检项编码', width: 130 }, { key: 'name', label: '点检项名称' }, { key: 'status', label: '启用状态', type: 'tag' }, { key: 'action', label: '操作', width: 160 }],
        detailFields: [['code', '点检项编码'], ['name', '点检项名称'], ['desc', '描述'], ['status', '启用状态']],
        data: [
            { code: 'II001', name: '油位检查', desc: '检查油位是否在标准刻度线', status: '启用' },
            { code: 'II002', name: '压力表读数', desc: '记录压力表读数并核对范围', status: '启用' },
            { code: 'II003', name: '温度检查', desc: '检查运行温度是否正常', status: '启用' },
            { code: 'II004', name: '异响检查', desc: '听辨设备运行异响', status: '启用' },
            { code: 'II005', name: '泄漏检查', desc: '检查气路油路泄漏', status: '启用' },
            { code: 'II006', name: '安全防护检查', desc: '检查防护罩与急停按钮', status: '禁用' },
        ]
    },

    // 点检计划（明细关联点检项目，保存后自动生成点检任务）
    'inspection-plan': { type: 'table', title: '点检计划',
        search: [{ name: 'equipment', label: '设备', type: 'input' }, { name: 'responsible', label: '负责人', type: 'input' }, { name: 'planName', label: '计划名称', type: 'input' }, { name: 'createTime', label: '创建时间', type: 'input', placeholder: 'YYYY-MM-DD ~ YYYY-MM-DD' }],
        buttons: [{ text: '新增', type: 'primary', action: 'add' }, { text: '刷新', type: 'default', action: 'refresh' }],
        columns: [{ key: 'equipment', label: '设备名称' }, { key: 'planName', label: '计划名称' }, { key: 'responsible', label: '负责人' }, { key: 'planStart', label: '计划开始时间', width: 110 }, { key: 'planEnd', label: '计划结束时间', width: 110 }, { key: 'status', label: '状态', type: 'tag' }, { key: 'remark', label: '备注' }, { key: 'createTime', label: '创建时间', width: 160 }, { key: 'action', label: '操作', width: 160 }],
        planKind: '点检',
        itemSourcePage: 'inspection-item',
        itemColumnLabel: '点检项名称',
        data: [
            { equipment: '静电喷涂机', planName: '喷涂机日常点检', responsible: '李四', planCode: 'IP20260101', planStart: '2026-01-16', planEnd: '2026-01-16', cycle: 1, cycleUnit: '天', status: '计划中', remark: '每日班前点检', createTime: '2026-01-06 08:30:00', items: [
                { name: '油位检查', remark: '' }, { name: '压力表读数', remark: '静电发生器压力' }, { name: '泄漏检查', remark: '' },
            ]},
            { equipment: '前处理清洗机', planName: '清洗机周点检', responsible: '张三', planCode: 'IP20260102', planStart: '2026-01-19', planEnd: '2026-01-19', cycle: 1, cycleUnit: '周', status: '计划中', remark: '每周一点检', createTime: '2026-01-08 10:00:00', items: [
                { name: '温度检查', remark: '槽液温度' }, { name: '异响检查', remark: '' },
            ]},
        ]
    },

    // 任务处理（保养/点检计划保存后自动生成任务）
    'maintenance-task': { type: 'table', title: '任务处理',
        search: [{ name: 'executor', label: '执行人', type: 'input' }, { name: 'planTime', label: '计划执行时间', type: 'input', placeholder: 'YYYY-MM-DD ~ YYYY-MM-DD' }],
        buttons: [{ text: '刷新', type: 'default', action: 'refresh' }],
        columns: [
            { key: 'taskNo', label: '任务编号', width: 145 }, { key: 'taskName', label: '任务名称' }, { key: 'equipment', label: '设备名称' },
            { key: 'maintType', label: '维护类型', type: 'tag' }, { key: 'executor', label: '执行人' },
            { key: 'planTime', label: '计划执行时间', width: 145 }, { key: 'actualStart', label: '实际开始时间', width: 145 },
            { key: 'actualEnd', label: '实际完成时间', width: 145 }, { key: 'status', label: '任务状态', type: 'tag' },
            { key: 'createTime', label: '创建时间', width: 145 }, { key: 'action', label: '操作', width: 100 },
        ],
        data: [
            { taskNo: 'MT20260118001', taskName: '输送链周保养', equipment: '悬挂输送链', maintType: '保养', executor: '张三', planTime: '2026-01-18 09:00', actualStart: '2026-01-18 09:10', actualEnd: '2026-01-18 11:30', status: '已完成', createTime: '2026-01-10 09:00:00', taskRemark: '已按保养项逐项完成', items: [
                { name: '传动链润滑', result: '正常', record: '全程润滑完成' }, { name: '紧固件检查', result: '正常', record: '无松动' },
            ]},
            { taskNo: 'MT20260210001', taskName: '空压机季度保养', equipment: '螺杆空压机', maintType: '保养', executor: '赵六', planTime: '2026-02-10 08:30', actualStart: '', actualEnd: '', status: '待执行', createTime: '2026-01-12 14:00:00', taskRemark: '', items: [
                { name: '更换润滑油', result: '', record: '' }, { name: '更换滤芯', result: '', record: '' }, { name: '紧固件检查', result: '', record: '' },
            ]},
            { taskNo: 'IT20260116001', taskName: '喷涂机日常点检', equipment: '静电喷涂机', maintType: '点检', executor: '李四', planTime: '2026-01-16 08:00', actualStart: '2026-01-16 08:05', actualEnd: '', status: '进行中', createTime: '2026-01-06 08:30:00', taskRemark: '压力表待更换后复检', items: [
                { name: '油位检查', result: '正常', record: '油位标准' }, { name: '压力表读数', result: '异常', record: '读数偏低，已报修' }, { name: '泄漏检查', result: '', record: '' },
            ]},
            { taskNo: 'IT20260119001', taskName: '清洗机周点检', equipment: '前处理清洗机', maintType: '点检', executor: '张三', planTime: '2026-01-19 09:00', actualStart: '', actualEnd: '', status: '待执行', createTime: '2026-01-08 10:00:00', taskRemark: '', items: [
                { name: '温度检查', result: '', record: '' }, { name: '异响检查', result: '', record: '' },
            ]},
        ]
    },

    // 任务执行页（独立页面，由任务处理"执行"进入）
    'maintenance-task-exec': { type: 'custom', render: 'renderTaskExecPage' },

    // ===== 质检设置 =====
    // ===== 质检设置 =====
    // 检验项目
    'qc-item': { type: 'table', title: '检验项目',
        search: [{ name: 'name', label: '项目名称', type: 'input', placeholder: '请输入项目名称搜索' }],
        buttons: [{ text: '添加', type: 'primary', action: 'add' }, { text: '刷新', type: 'default', action: 'refresh' }],
        columns: [{ key: 'name', label: '项目名称' }, { key: 'valueType', label: '项目类型' }, { key: 'method', label: '检验方法' }, { key: 'createTime', label: '创建时间', width: 160 }, { key: 'action', label: '操作', width: 160 }],
        detailFields: [['name', '项目名称'], ['valueType', '项目类型'], ['method', '检验方法'], ['standard', '检验标准'], ['createTime', '创建时间']],
        data: [
            { name: '膜厚', valueType: '数值', method: '涡流测厚仪测量', standard: '60-100μm', createTime: '2025-06-01 09:00:00' },
            { name: '附着力', valueType: '单选', method: '划格法（百格测试）', standard: '0级或1级为合格', createTime: '2025-06-01 09:05:00' },
            { name: '外观色差', valueType: '数值', method: '色差仪ΔE测量', standard: 'ΔE≤1.5', createTime: '2025-06-01 09:10:00' },
            { name: '外观缺陷', valueType: '文本', method: '目视检查（标准光源下）', standard: '无划伤、颗粒、流挂、露底', createTime: '2025-06-02 14:00:00' },
            { name: '耐盐雾性', valueType: '单选', method: '中性盐雾试验500h', standard: '无起泡、生锈、脱落', createTime: '2025-06-02 14:10:00' },
            { name: '尺寸', valueType: '数值', method: '卡尺/三坐标测量', standard: '按图纸公差±0.5mm', createTime: '2025-06-03 10:00:00' },
            { name: '硬度', valueType: '数值', method: '铅笔硬度计', standard: '≥2H', createTime: '2025-06-03 10:05:00' },
            { name: '光泽度', valueType: '数值', method: '光泽度仪60°角', standard: '85-95GU', createTime: '2025-06-05 15:00:00' },
        ]
    },

    // 质检方案（明细关联检验项目）
    'qc-plan': { type: 'table', title: '质检方案',
        search: [{ name: 'planName', label: '方案名称', type: 'input' }, { name: 'createTime', label: '创建时间', type: 'input', placeholder: 'YYYY-MM-DD ~ YYYY-MM-DD' }],
        buttons: [{ text: '新增', type: 'primary', action: 'add' }, { text: '刷新', type: 'default', action: 'refresh' }],
        columns: [{ key: 'planName', label: '方案名称' }, { key: 'inspectType', label: '检验类型', type: 'tag' }, { key: 'remark', label: '备注' }, { key: 'createTime', label: '创建时间', width: 160 }, { key: 'action', label: '操作', width: 160 }],
        inspectTypeOptions: ['来料检', '过程检', '成品入库检', '出货检', '综合检'],
        data: [
            { planName: '来料综合检验方案', inspectType: '来料检', remark: '原材料入厂全项检验', createTime: '2025-06-10 09:00:00', items: [
                { item: '外观缺陷', refVal: '-', minVal: '', maxVal: '', required: true, method: '目视检查（标准光源下）', standard: '无划伤、颗粒、流挂、露底' },
                { item: '膜厚', refVal: '80μm', minVal: '60', maxVal: '100', required: true, method: '涡流测厚仪测量', standard: '60-100μm' },
                { item: '附着力', refVal: '0级', minVal: '', maxVal: '', required: true, method: '划格法（百格测试）', standard: '0级或1级为合格' },
                { item: '尺寸', refVal: '-', minVal: '-0.5', maxVal: '0.5', required: false, method: '卡尺/三坐标测量', standard: '按图纸公差±0.5mm' },
            ]},
            { planName: '喷涂过程检验方案', inspectType: '过程检', remark: '喷涂工序过程巡检', createTime: '2025-06-12 10:30:00', items: [
                { item: '膜厚', refVal: '80μm', minVal: '60', maxVal: '100', required: true, method: '涡流测厚仪测量', standard: '60-100μm' },
                { item: '外观色差', refVal: 'ΔE≤1.0', minVal: '', maxVal: '1.5', required: true, method: '色差仪ΔE测量', standard: 'ΔE≤1.5' },
                { item: '外观缺陷', refVal: '-', minVal: '', maxVal: '', required: true, method: '目视检查（标准光源下）', standard: '无划伤、颗粒、流挂、露底' },
                { item: '光泽度', refVal: '90GU', minVal: '85', maxVal: '95', required: false, method: '光泽度仪60°角', standard: '85-95GU' },
            ]},
            { planName: '成品出货检验方案', inspectType: '出货检', remark: '出货前全项抽检', createTime: '2025-06-15 14:00:00', items: [
                { item: '外观缺陷', refVal: '-', minVal: '', maxVal: '', required: true, method: '目视检查（标准光源下）', standard: '无划伤、颗粒、流挂、露底' },
                { item: '附着力', refVal: '0级', minVal: '', maxVal: '', required: true, method: '划格法（百格测试）', standard: '0级或1级为合格' },
                { item: '光泽度', refVal: '90GU', minVal: '85', maxVal: '95', required: true, method: '光泽度仪60°角', standard: '85-95GU' },
                { item: '耐盐雾性', refVal: '500h通过', minVal: '', maxVal: '', required: false, method: '中性盐雾试验500h', standard: '无起泡、生锈、脱落' },
                { item: '硬度', refVal: '2H', minVal: '2', maxVal: '', required: false, method: '铅笔硬度计', standard: '≥2H' },
            ]},
            { planName: '电泳成品入库检验方案', inspectType: '成品入库检', remark: '电泳件入库检验', createTime: '2025-07-01 11:20:00', items: [
                { item: '膜厚', refVal: '20μm', minVal: '15', maxVal: '25', required: true, method: '涡流测厚仪测量', standard: '15-25μm' },
                { item: '外观缺陷', refVal: '-', minVal: '', maxVal: '', required: true, method: '目视检查（标准光源下）', standard: '无划伤、颗粒、针孔、露底' },
                { item: '耐盐雾性', refVal: '720h通过', minVal: '', maxVal: '', required: true, method: '中性盐雾试验720h', standard: '无起泡、生锈、脱落' },
            ]},
        ]
    },

    // ===== 质检任务（4页同构：14列，对齐真实系统） =====
    'qc-incoming': { type: 'table', title: '来料检',
        search: [
            { name: 'processName', label: '工序名称', type: 'input' },
            { name: 'orderNo', label: '生产订单', type: 'select', options: ['全部','MO20260821001','MO20260821002','MO20260818003','MO20260816004'] },
            { name: 'productName', label: '产品', type: 'input' },
        ],
        buttons: [{ text: '添加', type: 'primary', action: 'add' }, { text: '刷新', type: 'default', action: 'refresh' }],
        columns: [
            { key: 'orderNo', label: '生产订单编号', width: 130 }, { key: 'taskType', label: '任务类型', type: 'tag' },
            { key: 'productCode', label: '产品编码', width: 90 }, { key: 'productName', label: '产品名称' },
            { key: 'processName', label: '工序名称' }, { key: 'customerOrderNo', label: '客户单号', width: 115 },
            { key: 'customerName', label: '客户名称' }, { key: 'deliveryDate', label: '交付日期', width: 100 },
            { key: 'taskQty', label: '任务数量' }, { key: 'actualQty', label: '实检数量' },
            { key: 'passQty', label: '合格数量' }, { key: 'passRate', label: '合格率', type: 'progress', width: 130 },
            { key: 'createTime', label: '创建时间', width: 150 }, { key: 'action', label: '操作', width: 90 },
        ],
        qcTaskType: '来料检',
        data: [
            { orderNo: 'MO20260821001', taskType: '来料检', productCode: 'YJ001', productName: '脱脂剂', processName: '来料检验', customerOrderNo: 'PO-2026-0001', customerName: '杭州湾汽配', deliveryDate: '2026-08-30', taskQty: 800, actualQty: 800, passQty: 796, passRate: 99.5, createTime: '2026-08-21 10:00:00', reportNo: 'QR-20260821-001', inspector: '赵六', inspectTime: '2026-08-21 10:30:00', conclusion: '合格', remark: '抽检20袋，4袋封口不严退货', items: [
                { item: '外观缺陷', result: '包装完好无破损', judge: '合格' },
                { item: '尺寸', result: '袋重25.0kg±0.1', judge: '合格' },
                { item: '膜厚', result: '-', judge: '跳过' },
            ], photos: [{ kind: 'package', label: '来料包装' }, { kind: 'check', label: '抽检现场' }] },
            { orderNo: 'MO20260821002', taskType: '来料检', productCode: 'R003F716c', productName: '钢丝支架', processName: '来料检验', customerOrderNo: 'PO-2026-0002', customerName: '鼎结数智', deliveryDate: '2026-09-05', taskQty: 1000, actualQty: 500, passQty: 492, passRate: 98.4, createTime: '2026-08-21 11:20:00', reportNo: 'QR-20260821-002', inspector: '赵六', inspectTime: '2026-08-21 14:00:00', conclusion: '合格', remark: '8件表面轻微锈点，让步接收', items: [
                { item: '外观缺陷', result: '8件锈点，直径<0.5mm', judge: '让步接收' },
                { item: '尺寸', result: '关键尺寸全部合格', judge: '合格' },
            ], photos: [{ kind: 'rust', label: '支架锈点' }] },
            { orderNo: 'MO20260818003', taskType: '来料检', productCode: 'YL002', productName: '固化剂', processName: '来料检验', customerOrderNo: 'PO-2026-0003', customerName: '赛亦信息', deliveryDate: '2026-08-25', taskQty: 200, actualQty: 200, passQty: 185, passRate: 92.5, createTime: '2026-08-18 09:10:00', reportNo: 'QR-20260818-001', inspector: '李四', inspectTime: '2026-08-18 10:00:00', conclusion: '不合格', remark: '15桶批次色度超标，整批退货', items: [
                { item: '外观缺陷', result: '液体浑浊', judge: '不合格' },
                { item: '膜厚', result: '-', judge: '跳过' },
            ], photos: [{ kind: 'color', label: '色度超标' }, { kind: 'package', label: '整批桶装' }] },
        ]
    },

    'qc-process': { type: 'table', title: '过程检',
        search: [
            { name: 'processName', label: '工序名称', type: 'input' },
            { name: 'orderNo', label: '生产订单', type: 'select', options: ['全部','MO20260821001','MO20260821002','MO20260818003','MO20260816004'] },
            { name: 'productName', label: '产品', type: 'input' },
        ],
        buttons: [{ text: '添加', type: 'primary', action: 'add' }, { text: '刷新', type: 'default', action: 'refresh' }],
        columns: [
            { key: 'orderNo', label: '生产订单编号', width: 130 }, { key: 'taskType', label: '任务类型', type: 'tag' },
            { key: 'productCode', label: '产品编码', width: 90 }, { key: 'productName', label: '产品名称' },
            { key: 'processName', label: '工序名称' }, { key: 'customerOrderNo', label: '客户单号', width: 115 },
            { key: 'customerName', label: '客户名称' }, { key: 'deliveryDate', label: '交付日期', width: 100 },
            { key: 'taskQty', label: '任务数量' }, { key: 'actualQty', label: '实检数量' },
            { key: 'passQty', label: '合格数量' }, { key: 'passRate', label: '合格率', type: 'progress', width: 130 },
            { key: 'createTime', label: '创建时间', width: 150 }, { key: 'action', label: '操作', width: 90 },
        ],
        qcTaskType: '过程检',
        data: [
            { orderNo: 'MO20260821001', taskType: '过程检', productCode: 'YJ001', productName: '脱脂剂', processName: '电泳', customerOrderNo: 'PO-2026-0001', customerName: '杭州湾汽配', deliveryDate: '2026-08-30', taskQty: 800, actualQty: 100, passQty: 97, passRate: 97, createTime: '2026-08-22 15:00:00', reportNo: 'QR-20260822-101', inspector: '李四', inspectTime: '2026-08-22 15:30:00', conclusion: '合格', remark: '首件合格后批量生产', items: [
                { item: '膜厚', result: '平均19.8μm', judge: '合格' },
                { item: '外观缺陷', result: '3件针孔', judge: '返工' },
            ], photos: [{ kind: 'thick', label: '膜厚测量' }, { kind: 'particle', label: '针孔缺陷' }] },
            { orderNo: 'MO20260821002', taskType: '过程检', productCode: 'R003F716c', productName: '钢丝支架', processName: '喷粉', customerOrderNo: 'PO-2026-0002', customerName: '鼎结数智', deliveryDate: '2026-09-05', taskQty: 1000, actualQty: 80, passQty: 76, passRate: 95, createTime: '2026-08-23 16:40:00', reportNo: 'QR-20260823-102', inspector: '赵六', inspectTime: '2026-08-23 17:00:00', conclusion: '合格', remark: '换粉后首检4件色差，调整后合格', items: [
                { item: '膜厚', result: '平均82μm', judge: '合格' },
                { item: '外观色差', result: '首检ΔE=2.1，调整后0.8', judge: '合格' },
                { item: '光泽度', result: '88GU', judge: '合格' },
            ], photos: [{ kind: 'color', label: '色差对比' }] },
        ]
    },

    'qc-finished': { type: 'table', title: '成品入库检',
        search: [
            { name: 'processName', label: '工序名称', type: 'input' },
            { name: 'orderNo', label: '生产订单', type: 'select', options: ['全部','MO20260821001','MO20260821002','MO20260818003','MO20260816004'] },
            { name: 'productName', label: '产品', type: 'input' },
        ],
        buttons: [{ text: '添加', type: 'primary', action: 'add' }, { text: '刷新', type: 'default', action: 'refresh' }],
        columns: [
            { key: 'orderNo', label: '生产订单编号', width: 130 }, { key: 'taskType', label: '任务类型', type: 'tag' },
            { key: 'productCode', label: '产品编码', width: 90 }, { key: 'productName', label: '产品名称' },
            { key: 'processName', label: '工序名称' }, { key: 'customerOrderNo', label: '客户单号', width: 115 },
            { key: 'customerName', label: '客户名称' }, { key: 'deliveryDate', label: '交付日期', width: 100 },
            { key: 'taskQty', label: '任务数量' }, { key: 'actualQty', label: '实检数量' },
            { key: 'passQty', label: '合格数量' }, { key: 'passRate', label: '合格率', type: 'progress', width: 130 },
            { key: 'createTime', label: '创建时间', width: 150 }, { key: 'action', label: '操作', width: 90 },
        ],
        qcTaskType: '成品入库检',
        data: [
            { orderNo: 'MO20260816004', taskType: '成品入库检', productCode: 'SFT-RLR80973', productName: '拉杆', processName: '成品入库检', customerOrderNo: 'PO-2026-0004', customerName: '黑狐智造', deliveryDate: '2026-08-20', taskQty: 600, actualQty: 600, passQty: 597, passRate: 99.5, createTime: '2026-08-19 14:00:00', reportNo: 'QR-20260819-201', inspector: '王五', inspectTime: '2026-08-19 14:30:00', conclusion: '合格', remark: '3件挂具印，返抛处理后入库', items: [
                { item: '膜厚', result: '平均21μm', judge: '合格' },
                { item: '外观缺陷', result: '3件挂具印', judge: '返工' },
                { item: '附着力', result: '0级', judge: '合格' },
                { item: '耐盐雾性', result: '720h通过', judge: '合格' },
            ], photos: [{ kind: 'scratch', label: '挂具印' }, { kind: 'check', label: '成品抽检' }] },
        ]
    },

    'qc-outgoing': { type: 'table', title: '出货检',
        search: [
            { name: 'processName', label: '工序名称', type: 'input' },
            { name: 'orderNo', label: '生产订单', type: 'select', options: ['全部','MO20260821001','MO20260821002','MO20260818003','MO20260816004'] },
            { name: 'productName', label: '产品', type: 'input' },
        ],
        buttons: [{ text: '添加', type: 'primary', action: 'add' }, { text: '刷新', type: 'default', action: 'refresh' }],
        columns: [
            { key: 'orderNo', label: '生产订单编号', width: 130 }, { key: 'taskType', label: '任务类型', type: 'tag' },
            { key: 'productCode', label: '产品编码', width: 90 }, { key: 'productName', label: '产品名称' },
            { key: 'processName', label: '工序名称' }, { key: 'customerOrderNo', label: '客户单号', width: 115 },
            { key: 'customerName', label: '客户名称' }, { key: 'deliveryDate', label: '交付日期', width: 100 },
            { key: 'taskQty', label: '任务数量' }, { key: 'actualQty', label: '实检数量' },
            { key: 'passQty', label: '合格数量' }, { key: 'passRate', label: '合格率', type: 'progress', width: 130 },
            { key: 'createTime', label: '创建时间', width: 150 }, { key: 'action', label: '操作', width: 90 },
        ],
        qcTaskType: '出货检',
        data: [
            { orderNo: 'MO20260816004', taskType: '出货检', productCode: 'SFT-RLR80973', productName: '拉杆', processName: '出货检验', customerOrderNo: 'PO-2026-0004', customerName: '黑狐智造', deliveryDate: '2026-08-20', taskQty: 600, actualQty: 120, passQty: 120, passRate: 100, createTime: '2026-08-20 09:00:00', reportNo: 'QR-20260820-301', inspector: '王五', inspectTime: '2026-08-20 09:30:00', conclusion: '合格', remark: '按AQL 1.0抽检120件，全部合格，准予出货', items: [
                { item: '外观缺陷', result: '全数无缺陷', judge: '合格' },
                { item: '附着力', result: '0级', judge: '合格' },
                { item: '光泽度', result: '89GU', judge: '合格' },
                { item: '尺寸', result: '抽测30件全部合格', judge: '合格' },
            ], photos: [{ kind: 'check', label: '出货抽检' }, { kind: 'package', label: '出货包装' }] },
        ]
    },

    // 产品信息追溯（12列，对齐真实系统）
    'qc-trace': { type: 'table', title: '产品信息追溯',
        search: [
            { name: 'sn', label: '产品唯一码', type: 'input' },
            { name: 'status', label: '结果', type: 'select', options: ['全部','合格','不合格','待处理'] },
            { name: 'orderNo', label: '生产订单', type: 'select', options: ['全部','MO20260821001','MO20260821002','MO20260818003','MO20260816004'] },
            { name: 'customerName', label: '客户', type: 'select', options: ['全部','杭州湾汽配','鼎结数智','赛亦信息','黑狐智造','宁波汽配','吉利汽车'] },
        ],
        buttons: [{ text: '查询', type: 'primary', action: 'search' }, { text: '重置', type: 'default', action: 'reset' }],
        columns: [
            { key: 'sn', label: '产品唯一码', width: 135 }, { key: 'itemName', label: '检验项目' },
            { key: 'status', label: '状态', type: 'tag' }, { key: 'orderNo', label: '生产单号', width: 125 },
            { key: 'customerInfo', label: '客户信息' }, { key: 'defectReason', label: '不合格原因' },
            { key: 'defectPhoto', label: '不合格图片', type: 'photo' }, { key: 'defectLevel', label: '不合格等级' },
            { key: 'suggest', label: '建议处理' }, { key: 'handleRemark', label: '处理备注' },
            { key: 'createTime', label: '创建时间', width: 150 }, { key: 'creator', label: '创建人' },
            { key: 'action', label: '操作', width: 90 },
        ],
        data: [
            { sn: 'SN20260821001-A037', itemName: '外观缺陷', status: '不合格', orderNo: 'MO20260821001', customerInfo: '杭州湾汽配（PO-2026-0001）', defectReason: '漆膜颗粒杂质', defectPhoto: { kind: 'particle', label: '颗粒缺陷' }, defectLevel: 'B级（严重）', suggest: '返抛重喷', handleRemark: '已返工复检合格', createTime: '2026-08-22 16:10:00', creator: '李四',
              timeline: [
                  { time: '2026-08-21 09:30', node: '来料检验', result: '合格', note: '脱脂剂入厂检验' },
                  { time: '2026-08-21 14:00', node: '上挂', result: '通过', note: '上挂完成' },
                  { time: '2026-08-22 10:00', node: '电泳', result: '合格', note: '膜厚19.5μm' },
                  { time: '2026-08-22 16:00', node: '喷粉·过程检', result: '不合格', note: '检出颗粒缺陷，判定B级' },
                  { time: '2026-08-23 08:30', node: '返工处理', result: '合格', note: '返抛重喷后复检合格' },
              ] },
            { sn: 'SN20260821002-B112', itemName: '外观色差', status: '待处理', orderNo: 'MO20260821002', customerInfo: '鼎结数智（PO-2026-0002）', defectReason: 'ΔE=2.1超标准', defectPhoto: { kind: 'color', label: '色差对比' }, defectLevel: 'C级（轻微）', suggest: '技术评审', handleRemark: '待质量工程师确认', createTime: '2026-08-23 17:20:00', creator: '赵六',
              timeline: [
                  { time: '2026-08-21 10:20', node: '来料检验', result: '合格', note: '钢丝支架入厂检验' },
                  { time: '2026-08-23 16:30', node: '喷粉·过程检', result: '不合格', note: '首检色差ΔE=2.1' },
                  { time: '2026-08-23 17:20', node: '缺陷登记', result: '待处理', note: '已提交技术评审' },
              ] },
            { sn: 'SN20260818003-C005', itemName: '外观缺陷', status: '不合格', orderNo: 'MO20260818003', customerInfo: '赛亦信息（PO-2026-0003）', defectReason: '固化剂液体浑浊', defectPhoto: { kind: 'color', label: '液体浑浊' }, defectLevel: 'A级（致命）', suggest: '整批退货', handleRemark: '已通知供应商退货', createTime: '2026-08-18 10:20:00', creator: '李四',
              timeline: [
                  { time: '2026-08-18 09:10', node: '来料检验', result: '不合格', note: '固化剂色度超标15桶' },
                  { time: '2026-08-18 10:20', node: '缺陷登记', result: '不合格', note: 'A级缺陷，整批退货' },
              ] },
            { sn: 'SN20260816004-D218', itemName: '附着力', status: '合格', orderNo: 'MO20260816004', customerInfo: '黑狐智造（PO-2026-0004）', defectReason: '-', defectPhoto: null, defectLevel: '-', suggest: '-', handleRemark: '百格测试0级', createTime: '2026-08-19 15:00:00', creator: '王五',
              timeline: [
                  { time: '2026-08-19 14:30', node: '成品入库检', result: '合格', note: '百格测试0级' },
                  { time: '2026-08-20 09:30', node: '出货检验', result: '合格', note: 'AQL抽检120件合格' },
              ] },
        ]
    },

    // 批量质检统计（统计卡片+图表+15列）
    'qc-batch': { type: 'custom', render: 'renderQcBatchPage', title: '批量质检统计',
        // 汇总数据 + 环比（演示写死）
        summary: { total: 2100, pass: 2068, defect: 32, avgRate: 98.5,
            trend: { total: '+12.5%', pass: '+10.8%', defect: '-8.6%', avgRate: '+0.3%' } },
        // 左侧饼图：质检任务状态分布（数值写死，占比由 ECharts 按实际计算）
        statusPie: [
            { name: '待质检', value: 300, color: '#2563eb' },
            { name: '质检中', value: 1800, color: '#facc15' },
            { name: '已完成', value: 600, color: '#22c55e' },
        ],
        // 右侧饼图：检验类型分布（合计 2100）
        typePie: [
            { name: '来料检', value: 756, color: '#2563eb' },
            { name: '过程检', value: 630, color: '#facc15' },
            { name: '成品入库检', value: 420, color: '#22c55e' },
            { name: '出货检', value: 294, color: '#06b6d4' },
        ],
        data: [
            { orderNo: 'MO20260821001', customerName: '杭州湾汽配', productName: '脱脂剂', reportDate: '2026-08-21', inspector: '赵六', inspectType: '来料检', statDate: '2026-08-21', totalQty: 800, defectQty: 4, passQty: 796, passRate: 99.5, defectCodes: 'SN-0762、SN-0763、SN-0789、SN-0795', defectPhotos: [{ kind: 'package', label: '封口不严' }], defectReason: '包装封口不严' },
            { orderNo: 'MO20260821002', customerName: '鼎结数智', productName: '钢丝支架', reportDate: '2026-08-21', inspector: '赵六', inspectType: '来料检', statDate: '2026-08-21', totalQty: 500, defectQty: 8, passQty: 492, passRate: 98.4, defectCodes: 'SN-B102~SN-B109（8件）', defectPhotos: [{ kind: 'rust', label: '支架锈点' }], defectReason: '表面轻微锈点' },
            { orderNo: 'MO20260818003', customerName: '赛亦信息', productName: '固化剂', reportDate: '2026-08-18', inspector: '李四', inspectType: '来料检', statDate: '2026-08-18', totalQty: 200, defectQty: 15, passQty: 185, passRate: 92.5, defectCodes: '桶号L-031~L-045（15桶）', defectPhotos: [{ kind: 'color', label: '色度超标' }, { kind: 'package', label: '整批桶装' }], defectReason: '批次色度超标' },
            { orderNo: 'MO20260821001', customerName: '杭州湾汽配', productName: '脱脂剂', reportDate: '2026-08-22', inspector: '李四', inspectType: '过程检', statDate: '2026-08-22', totalQty: 100, defectQty: 3, passQty: 97, passRate: 97, defectCodes: 'SN-A031、SN-A037、SN-A052', defectPhotos: [{ kind: 'particle', label: '针孔缺陷' }], defectReason: '电泳针孔' },
            { orderNo: 'MO20260816004', customerName: '黑狐智造', productName: '拉杆', reportDate: '2026-08-19', inspector: '王五', inspectType: '成品入库检', statDate: '2026-08-19', totalQty: 600, defectQty: 3, passQty: 597, passRate: 99.5, defectCodes: 'SN-D101、SN-D218、SN-D356', defectPhotos: [{ kind: 'scratch', label: '挂具印' }], defectReason: '挂具印' },
        ]
    },

    // 单独质检统计（统计卡片+图表+13列）
    'qc-single': { type: 'custom', render: 'renderQcSinglePage', title: '单独质检统计',
        // 汇总数据 + 环比（演示写死）
        summary: { total: 6, pass: 4, fail: 2, passRate: 66.7,
            trend: { total: '+20.0%', pass: '+33.3%', fail: '-25.0%', passRate: '-12.5%' } },
        chartData: [
            { label: '膜厚', value: 100 }, { label: '附着力', value: 100 },
            { label: '外观缺陷', value: 50 }, { label: '外观色差', value: 33.3 },
            { label: '耐盐雾性', value: 100 }, { label: '光泽度', value: 100 },
        ],
        data: [
            { sn: 'SN20260821001-A037', orderNo: 'MO20260821001', processName: '喷粉', planName: '喷涂过程检验方案', customerName: '杭州湾汽配', productName: '脱脂剂', reportDate: '2026-08-22', inspector: '李四', itemName: '外观缺陷', result: '不合格', photos: [{ kind: 'particle', label: '颗粒缺陷' }], defectReason: '漆膜颗粒杂质' },
            { sn: 'SN20260821001-A052', orderNo: 'MO20260821001', processName: '喷粉', planName: '喷涂过程检验方案', customerName: '杭州湾汽配', productName: '脱脂剂', reportDate: '2026-08-22', inspector: '李四', itemName: '膜厚', result: '合格', photos: [{ kind: 'thick', label: '膜厚测量' }], defectReason: '-' },
            { sn: 'SN20260821002-B112', orderNo: 'MO20260821002', processName: '喷粉', planName: '喷涂过程检验方案', customerName: '鼎结数智', productName: '钢丝支架', reportDate: '2026-08-23', inspector: '赵六', itemName: '外观色差', result: '不合格', photos: [{ kind: 'color', label: '色差对比' }], defectReason: 'ΔE=2.1超标准' },
            { sn: 'SN20260818003-C005', orderNo: 'MO20260818003', processName: '来料检验', planName: '来料综合检验方案', customerName: '赛亦信息', productName: '固化剂', reportDate: '2026-08-18', inspector: '李四', itemName: '外观缺陷', result: '不合格', photos: [{ kind: 'color', label: '液体浑浊' }], defectReason: '固化剂液体浑浊' },
            { sn: 'SN20260816004-D218', orderNo: 'MO20260816004', processName: '成品入库检', planName: '电泳成品入库检验方案', customerName: '黑狐智造', productName: '拉杆', reportDate: '2026-08-19', inspector: '王五', itemName: '附着力', result: '合格', photos: [{ kind: 'check', label: '百格测试' }], defectReason: '-' },
            { sn: 'SN20260816004-D356', orderNo: 'MO20260816004', processName: '成品入库检', planName: '电泳成品入库检验方案', customerName: '黑狐智造', productName: '拉杆', reportDate: '2026-08-19', inspector: '王五', itemName: '耐盐雾性', result: '合格', photos: [{ kind: 'check', label: '盐雾试验' }], defectReason: '-' },
        ]
    },

    // 质检报告（独立页面：从质检任务"查看"进入，不在侧边菜单显示）
    'qc-report': { type: 'custom', render: 'renderQcReportPage', title: '质检报告' },

    // ===== 库存管理（对齐真实系统：库存查询/其他入库/其他出库/销售出库/库存预警） =====
    // 库存查询（数量随出入库单据/库存调整实时联动）
    'inv-stock': { type: 'custom', render: 'renderInvStockPage', title: '库存查询',
        data: [
            { productCode: 'CP001', productName: '汽车前保险杠', specification: '500×200×80mm', material: 'ABS塑料', unit: '件', quantity: 320, remarks: '', warehouse: '成品仓', alertMin: 100, alertMax: 800 },
            { productCode: 'JH1824A', productName: '短片', specification: '-', material: '铝合金', unit: '件', quantity: 58, remarks: '电泳产品', warehouse: '成品仓', alertMin: 100, alertMax: 500 },
            { productCode: 'CP002', productName: 'MR后轮毂', specification: '-', material: '铝合金', unit: '件', quantity: 1250, remarks: '', warehouse: '半成品仓', alertMin: 200, alertMax: 1000 },
            { productCode: 'YL002', productName: '固化剂', specification: '20kg/桶', material: '化学制剂', unit: '桶', quantity: 85, remarks: '避光存放', warehouse: '原料仓', alertMin: 30, alertMax: 300 },
            { productCode: 'YJ001', productName: '脱脂剂', specification: '25kg/桶', material: '化学制剂', unit: '桶', quantity: 12, remarks: '', warehouse: '原料仓', alertMin: 20, alertMax: 200 },
            { productCode: 'CJ001', productName: '测试产品1', specification: '-', material: '-', unit: '件', quantity: 66, remarks: '', warehouse: '半成品仓', alertMin: 50, alertMax: 500 },
            { productCode: 'CJ002', productName: '测试产品2', specification: '-', material: '-', unit: '件', quantity: 40, remarks: '', warehouse: '半成品仓', alertMin: 50, alertMax: 500 },
            { productCode: 'CJ003', productName: '测试产品003', specification: '-', material: '-', unit: '件', quantity: 210, remarks: '', warehouse: '半成品仓', alertMin: 50, alertMax: 500 },
        ]
    },

    // 其他入库（保存后库存自动增加）
    'inv-in-list': { type: 'table', title: '其他入库',
        search: [{ name: 'kw', label: '订单号', type: 'input', placeholder: '请输入订单号搜索' }, { name: 'startDate', label: '开始日期', type: 'date' }, { name: 'endDate', label: '结束日期', type: 'date' }],
        searchButtons: [{ text: '搜索', type: 'primary', action: 'search' }, { text: '重置', type: 'default', action: 'reset' }],
        buttons: [{ text: '添加', type: 'primary', action: 'add' }, { text: '刷新', type: 'default', action: 'refresh' }],
        columns: [{ key: 'sn', label: '订单号' }, { key: 'createTime', label: '创建时间' }, { key: 'createrName', label: '创建人' }, { key: 'memo', label: '备注' }, { key: 'action', label: '操作', width: 170 }],
        data: [
            { sn: 'RK20260822002', createTime: '2026-08-22 09:30:00', createrName: '王五', memo: '脱脂剂紧急补货', items: [
                { productCode: 'YJ001', productName: '脱脂剂', specification: '25kg/桶', material: '化学制剂', unit: '桶', quantity: 30, remarks: '紧急采购' },
            ]},
            { sn: 'RK20260821003', createTime: '2026-08-21 10:30:00', createrName: '李四', memo: 'MR后轮毂完工入库', items: [
                { productCode: 'CP002', productName: 'MR后轮毂', specification: '-', material: '铝合金', unit: '件', quantity: 800, remarks: '电泳完工' },
            ]},
            { sn: 'RK20260816001', createTime: '2026-08-16 09:00:00', createrName: '王五', memo: '化学品采购入库', items: [
                { productCode: 'YL002', productName: '固化剂', specification: '20kg/桶', material: '化学制剂', unit: '桶', quantity: 100, remarks: '' },
                { productCode: 'YJ001', productName: '脱脂剂', specification: '25kg/桶', material: '化学制剂', unit: '桶', quantity: 50, remarks: '' },
            ]},
            { sn: 'RK20260814003', createTime: '2026-08-14 10:10:00', createrName: '李四', memo: '短片电泳完工入库', items: [
                { productCode: 'JH1824A', productName: '短片', specification: '-', material: '铝合金', unit: '件', quantity: 160, remarks: '电泳完工' },
            ]},
            { sn: 'RK20260810001', createTime: '2026-08-10 09:20:00', createrName: 'admin', memo: '前保险杠采购入库', items: [
                { productCode: 'CP001', productName: '汽车前保险杠', specification: '500×200×80mm', material: 'ABS塑料', unit: '件', quantity: 500, remarks: '供应商：伟福汽车' },
            ]},
        ]
    },

    // 其他出库（保存后库存自动扣减，出库前校验库存充足）
    'inv-out-list': { type: 'table', title: '其他出库',
        search: [{ name: 'kw', label: '订单号', type: 'input', placeholder: '请输入订单号搜索' }, { name: 'startDate', label: '开始日期', type: 'date' }, { name: 'endDate', label: '结束日期', type: 'date' }],
        searchButtons: [{ text: '搜索', type: 'primary', action: 'search' }, { text: '重置', type: 'default', action: 'reset' }],
        buttons: [{ text: '添加', type: 'primary', action: 'add' }, { text: '刷新', type: 'default', action: 'refresh' }],
        columns: [{ key: 'sn', label: '订单号' }, { key: 'createTime', label: '创建时间' }, { key: 'createrName', label: '创建人' }, { key: 'memo', label: '备注' }, { key: 'action', label: '操作', width: 170 }],
        data: [
            { sn: 'CK20260822001', createTime: '2026-08-22 14:20:00', createrName: '赵六', memo: '前处理线领用固化剂', items: [
                { productCode: 'YL002', productName: '固化剂', specification: '20kg/桶', material: '化学制剂', unit: '桶', quantity: 15, remarks: '电泳槽补加' },
            ]},
            { sn: 'CK20260819001', createTime: '2026-08-19 16:40:00', createrName: '赵六', memo: '脱脂线领料', items: [
                { productCode: 'YJ001', productName: '脱脂剂', specification: '25kg/桶', material: '化学制剂', unit: '桶', quantity: 38, remarks: '' },
            ]},
            { sn: 'CK20260815002', createTime: '2026-08-15 11:30:00', createrName: '王五', memo: '售后件领用', items: [
                { productCode: 'CP001', productName: '汽车前保险杠', specification: '500×200×80mm', material: 'ABS塑料', unit: '件', quantity: 25, remarks: '售后索赔件' },
            ]},
            { sn: 'CK20260812001', createTime: '2026-08-12 10:05:00', createrName: '王五', memo: '不良品报废处理', items: [
                { productCode: 'CJ003', productName: '测试产品003', specification: '-', material: '-', unit: '件', quantity: 10, remarks: '外观不良报废' },
            ]},
        ]
    },

    // 销售出库（保存后库存自动扣减，支持打印送货单）
    'inv-sales-list': { type: 'table', title: '销售出库',
        search: [{ name: 'orderNo', label: '单号', type: 'input', placeholder: '请输入单号' }, { name: 'product', label: '产品', type: 'input', placeholder: '请输入产品名称' }, { name: 'startDate', label: '开始日期', type: 'date' }, { name: 'endDate', label: '结束日期', type: 'date' }],
        searchButtons: [{ text: '查询', type: 'primary', action: 'search' }, { text: '重置', type: 'default', action: 'reset' }],
        buttons: [{ text: '新建销售出库单', type: 'primary', action: 'add' }, { text: '刷新', type: 'default', action: 'refresh' }],
        columns: [{ key: 'orderNo', label: '单号' }, { key: 'partnerName', label: '收货单位' }, { key: 'outboundDate', label: '出库日期' }, { key: 'productNames', label: '产品' }, { key: 'totalQuantity', label: '送货数合计' }, { key: 'operatorName', label: '操作员' }, { key: 'remarks', label: '备注' }, { key: 'createTime', label: '创建时间' }, { key: 'action', label: '操作', width: 170 }],
        data: [
            { orderNo: 'XS20260818001', partnerName: '杭州湾汽配', outboundDate: '2026-08-18', productNames: '短片、汽车前保险杠', totalQuantity: 202, operatorName: '赵六', remarks: '加急送货', createTime: '2026-08-18 15:20:00', items: [
                { productCode: 'JH1824A', productName: '短片', specification: '-', processName: '电泳', quantity: 102, totalWeight: 306, boxCount: 6, remarks: '' },
                { productCode: 'CP001', productName: '汽车前保险杠', specification: '500×200×80mm', processName: '面漆', quantity: 100, totalWeight: 180, boxCount: 10, remarks: '客户自提' },
            ]},
            { orderNo: 'XS20260817002', partnerName: '鼎结数智', outboundDate: '2026-08-17', productNames: 'MR后轮毂', totalQuantity: 350, operatorName: '李四', remarks: '', createTime: '2026-08-17 09:15:00', items: [
                { productCode: 'CP002', productName: 'MR后轮毂', specification: '-', processName: '电泳', quantity: 350, totalWeight: 1050, boxCount: 18, remarks: '' },
            ]},
            { orderNo: 'XS20260812001', partnerName: '黑狐智造', outboundDate: '2026-08-12', productNames: '汽车前保险杠', totalQuantity: 180, operatorName: '王五', remarks: '随车附质检报告', createTime: '2026-08-12 14:05:00', items: [
                { productCode: 'CP001', productName: '汽车前保险杠', specification: '500×200×80mm', processName: '面漆', quantity: 180, totalWeight: 324, boxCount: 18, remarks: '' },
            ]},
        ]
    },

    // 库存预警（实时联动预警 + 预置历史预警混合展示）
    'inv-alert': { type: 'custom', render: 'renderInvAlertPage', title: '库存预警' },

    // 入库/出库单编辑器（独立页面，不在侧边菜单显示）
    'inv-in-edit': { type: 'custom', render: 'renderInvOpEditPage', title: '新增入库单' },
    'inv-out-edit': { type: 'custom', render: 'renderInvOpEditPage', title: '新增出库单' },
    // 销售出库单编辑器（独立页面，不在侧边菜单显示）
    'inv-sales-edit': { type: 'custom', render: 'renderInvSalesEditPage', title: '新建销售出库单' },

    // ===== 能耗管理（对齐真实系统：能耗记录/费用设置/初始能耗） =====
    // 能耗记录（保存时自动计算：当天使用量=读数-上期读数，当天费用=使用量×单价）
    'energy-record': { type: 'table', title: '能耗记录',
        search: [{ name: 'type', label: '能耗类型', type: 'select', options: ['全部','水','电','燃气'] }, { name: 'startDate', label: '使用开始', type: 'date' }, { name: 'endDate', label: '使用结束', type: 'date' }],
        searchButtons: [{ text: '搜索', type: 'primary', action: 'search' }, { text: '重置', type: 'default', action: 'reset' }],
        buttons: [{ text: '添加', type: 'primary', action: 'add' }, { text: '刷新', type: 'default', action: 'refresh' }],
        columns: [{ key: 'type', label: '能耗类型' }, { key: 'usageDate', label: '使用日期' }, { key: 'meterReading', label: '抄表读数' }, { key: 'usage', label: '当天使用量' }, { key: 'cost', label: '当天费用(元)' }, { key: 'remark', label: '备注' }, { key: 'createTime', label: '创建时间' }, { key: 'createrName', label: '创建人' }, { key: 'action', label: '操作', width: 170 }],
        data: [
            { id: 1, type: '电', usageDate: '2026-08-23', meterReading: 128600, usage: 2350, cost: 2467.5, remark: '夜班耗电偏高', createTime: '2026-08-24 08:00:00', createrName: '张三' },
            { id: 2, type: '水', usageDate: '2026-08-23', meterReading: 51280, usage: 78, cost: 300.3, remark: '', createTime: '2026-08-24 08:05:00', createrName: '张三' },
            { id: 3, type: '燃气', usageDate: '2026-08-23', meterReading: 32450, usage: 210, cost: 672, remark: '烘烤线满负荷', createTime: '2026-08-24 08:10:00', createrName: '张三' },
            { id: 4, type: '电', usageDate: '2026-08-22', meterReading: 126250, usage: 2100, cost: 2205, remark: '', createTime: '2026-08-23 08:00:00', createrName: '张三' },
            { id: 5, type: '水', usageDate: '2026-08-22', meterReading: 51202, usage: 82, cost: 315.7, remark: '前处理线清洗', createTime: '2026-08-23 08:05:00', createrName: '张三' },
            { id: 6, type: '电', usageDate: '2026-08-21', meterReading: 124150, usage: 2280, cost: 2394, remark: '', createTime: '2026-08-22 08:00:00', createrName: '李四' },
            { id: 7, type: '燃气', usageDate: '2026-08-21', meterReading: 32030, usage: 180, cost: 576, remark: '', createTime: '2026-08-22 08:10:00', createrName: '李四' },
        ]
    },

    // 费用设置（单价实时影响能耗记录的当天费用计算）
    'energy-price': { type: 'custom', render: 'renderEnergyPricePage', title: '费用设置' },
    // 初始能耗（作为首条能耗记录使用量计算的基准）
    'energy-initial': { type: 'custom', render: 'renderEnergyInitialPage', title: '初始能耗' },
    // 能耗记录编辑器（独立页面，不在侧边菜单显示）
    'energy-edit': { type: 'custom', render: 'renderEnergyEditPage', title: '添加能耗记录' },

    // 质检报告工作台（独立页面：质检任务添加/编辑；批量检验 / 单独检验两种模式）
    'qc-report-edit': { type: 'custom', render: 'renderQcReportEditPage', title: '质检报告工作台',
        inspectorOptions: ['张三', '李四', '王五', '赵六'],
        defectLevelOptions: ['一般', '严重', '致命'],
        defectTypeOptions: ['外观不合格', '性能不合格', '尺寸不合格', '包装不合格', '材质不合格'],
        defectReasonOptions: ['漆膜颗粒杂质', '针孔缺陷', '膜厚不足', '色差超标', '表面划伤', '局部变形', '封口不严', '其他'],
        handleOptions: ['返工返修', '报废', '让步接收', '退货', '技术评审'],
    },

    // ===== 数据采集（对齐真实系统：数据分组/数据管理/数据记录/加料记录） =====
    // 数据分组（增删联动数据管理的"所属分组"选项）
    'dc-group': { type: 'table', title: '数据分组',
        search: [{ name: 'kw', label: '分组名称', type: 'input', placeholder: '请输入分组名称搜索' }],
        searchButtons: [{ text: '搜索', type: 'primary', action: 'search' }, { text: '重置', type: 'default', action: 'reset' }],
        buttons: [{ text: '添加', type: 'primary', action: 'add' }, { text: '刷新', type: 'default', action: 'refresh' }],
        columns: [{ key: 'name', label: '分组名称' }, { key: 'createTime', label: '创建时间' }, { key: 'action', label: '操作', width: 150 }],
        data: [
            { id: 1, name: '前处理药剂', createTime: '2026-08-01 09:00:00' },
            { id: 2, name: '电泳槽液', createTime: '2026-08-01 09:05:00' },
            { id: 3, name: '烘烤线', createTime: '2026-08-01 09:10:00' },
            { id: 4, name: '水质监测', createTime: '2026-08-05 14:20:00' },
        ]
    },

    // 数据管理（上下限用于数据记录保存时的超标判定；最新值随数据记录实时联动）
    'dc-standard': { type: 'table', title: '数据管理',
        search: [{ name: 'kw', label: '名称', type: 'input', placeholder: '请输入名称搜索' }, { name: 'group', label: '所属分组', type: 'select', options: ['全部'], sourcePage: 'dc-group' }],
        searchButtons: [{ text: '搜索', type: 'primary', action: 'search' }, { text: '重置', type: 'default', action: 'reset' }],
        buttons: [{ text: '添加', type: 'primary', action: 'add' }, { text: '刷新', type: 'default', action: 'refresh' }],
        columns: [{ key: 'name', label: '名称' }, { key: 'groupName', label: '所属分组' }, { key: 'lower', label: '下限值' }, { key: 'upper', label: '上限值' }, { key: 'unit', label: '单位' }, { key: 'remark', label: '备注' }, { key: 'latestValue', label: '最新值' }, { key: 'latestTime', label: '最新采集时间' }, { key: 'latestStatus', label: '最新状态', type: 'tag' }, { key: 'createTime', label: '创建时间' }, { key: 'action', label: '操作', width: 200 }],
        data: [
            { id: 1, name: '脱脂剂浓度', groupId: 1, groupName: '前处理药剂', lower: 50, upper: 80, unit: 'g/L', remark: '每天检测', latestValue: 62, latestTime: '2026-08-23 11:00:00', latestStatus: '正常', createTime: '2026-08-01 09:20:00' },
            { id: 2, name: '表调剂PH', groupId: 1, groupName: '前处理药剂', lower: 8.5, upper: 9.5, unit: 'pH', remark: '', latestValue: 9.1, latestTime: '2026-08-23 11:00:00', latestStatus: '正常', createTime: '2026-08-01 09:25:00' },
            { id: 3, name: '电泳槽固体分', groupId: 2, groupName: '电泳槽液', lower: 18, upper: 22, unit: '%', remark: '补浆依据', latestValue: 17.2, latestTime: '2026-08-23 14:30:00', latestStatus: '低于下限', createTime: '2026-08-01 09:30:00' },
            { id: 4, name: '电泳槽电导率', groupId: 2, groupName: '电泳槽液', lower: 1200, upper: 1800, unit: 'μS/cm', remark: '', latestValue: 1560, latestTime: '2026-08-23 14:30:00', latestStatus: '正常', createTime: '2026-08-01 09:35:00' },
            { id: 5, name: '电泳槽温度', groupId: 2, groupName: '电泳槽液', lower: 26, upper: 30, unit: '℃', remark: '制冷机组控制', latestValue: 27.5, latestTime: '2026-08-23 14:30:00', latestStatus: '正常', createTime: '2026-08-01 09:40:00' },
            { id: 6, name: '电泳槽PH', groupId: 2, groupName: '电泳槽液', lower: 5.8, upper: 6.4, unit: 'pH', remark: '', latestValue: 6.1, latestTime: '2026-08-23 14:30:00', latestStatus: '正常', createTime: '2026-08-01 09:45:00' },
            { id: 7, name: '烘道温度', groupId: 3, groupName: '烘烤线', lower: 170, upper: 185, unit: '℃', remark: '双区记录', latestValue: 176, latestTime: '2026-08-23 11:00:00', latestStatus: '正常', createTime: '2026-08-01 09:50:00' },
            { id: 8, name: '纯水电导率', groupId: 4, groupName: '水质监测', lower: 0, upper: 10, unit: 'μS/cm', remark: '前处理末道水洗', latestValue: 12.4, latestTime: '2026-08-23 11:00:00', latestStatus: '超上限', createTime: '2026-08-05 14:30:00' },
        ]
    },

    // 数据记录（保存时按上下限自动判定超标；保存后联动数据管理最新值）
    'dc-record': { type: 'table', title: '数据记录',
        search: [{ name: 'startDate', label: '开始时间', type: 'date' }, { name: 'endDate', label: '结束时间', type: 'date' }],
        searchButtons: [{ text: '搜索', type: 'primary', action: 'search' }, { text: '重置', type: 'default', action: 'reset' }],
        buttons: [{ text: '批量添加', type: 'primary', action: 'add' }, { text: '刷新', type: 'default', action: 'refresh' }],
        columns: [{ key: 'collectTime', label: '采集时间' }, { key: 'paramCount', label: '参数数量' }, { key: 'paramNames', label: '采集参数' }, { key: 'status', label: '状态', type: 'tag' }, { key: 'createTime', label: '创建时间' }, { key: 'action', label: '操作', width: 170 }],
        data: [
            { id: 1, collectTime: '2026-08-23 14:30:00', carrierNo: 'JZ-1024', params: [
                { name: '电泳槽固体分', groupName: '电泳槽液', unit: '%', lower: 18, upper: 22, value: 17.2, status: '低于下限' },
                { name: '电泳槽电导率', groupName: '电泳槽液', unit: 'μS/cm', lower: 1200, upper: 1800, value: 1560, status: '正常' },
                { name: '电泳槽温度', groupName: '电泳槽液', unit: '℃', lower: 26, upper: 30, value: 27.5, status: '正常' },
                { name: '电泳槽PH', groupName: '电泳槽液', unit: 'pH', lower: 5.8, upper: 6.4, value: 6.1, status: '正常' },
            ], status: '有超标', createTime: '2026-08-23 14:31:00' },
            { id: 2, collectTime: '2026-08-23 11:00:00', carrierNo: 'JZ-1024', params: [
                { name: '脱脂剂浓度', groupName: '前处理药剂', unit: 'g/L', lower: 50, upper: 80, value: 62, status: '正常' },
                { name: '表调剂PH', groupName: '前处理药剂', unit: 'pH', lower: 8.5, upper: 9.5, value: 9.1, status: '正常' },
                { name: '纯水电导率', groupName: '水质监测', unit: 'μS/cm', lower: 0, upper: 10, value: 12.4, status: '超上限' },
                { name: '烘道温度', groupName: '烘烤线', unit: '℃', lower: 170, upper: 185, value: 176, status: '正常' },
            ], status: '有超标', createTime: '2026-08-23 11:01:00' },
            { id: 3, collectTime: '2026-08-23 09:00:00', carrierNo: 'JZ-1024', params: [
                { name: '脱脂剂浓度', groupName: '前处理药剂', unit: 'g/L', lower: 50, upper: 80, value: 62, status: '正常' },
                { name: '表调剂PH', groupName: '前处理药剂', unit: 'pH', lower: 8.5, upper: 9.5, value: 9.1, status: '正常' },
                { name: '烘道温度', groupName: '烘烤线', unit: '℃', lower: 170, upper: 185, value: 178, status: '正常' },
            ], status: '正常', createTime: '2026-08-23 09:01:00' },
            { id: 4, collectTime: '2026-08-22 15:20:00', carrierNo: 'JZ-0987', params: [
                { name: '电泳槽固体分', groupName: '电泳槽液', unit: '%', lower: 18, upper: 22, value: 19.8, status: '正常' },
                { name: '电泳槽电导率', groupName: '电泳槽液', unit: 'μS/cm', lower: 1200, upper: 1800, value: 1720, status: '正常' },
                { name: '电泳槽温度', groupName: '电泳槽液', unit: '℃', lower: 26, upper: 30, value: 28.2, status: '正常' },
            ], status: '正常', createTime: '2026-08-22 15:21:00' },
            { id: 5, collectTime: '2026-08-22 10:00:00', carrierNo: 'JZ-0987', params: [
                { name: '脱脂剂浓度', groupName: '前处理药剂', unit: 'g/L', lower: 50, upper: 80, value: 71, status: '正常' },
                { name: '表调剂PH', groupName: '前处理药剂', unit: 'pH', lower: 8.5, upper: 9.5, value: 8.9, status: '正常' },
                { name: '纯水电导率', groupName: '水质监测', unit: 'μS/cm', lower: 0, upper: 10, value: 8.6, status: '正常' },
            ], status: '正常', createTime: '2026-08-22 10:01:00' },
        ]
    },

    // 加料记录（由数据记录按分组透视生成矩阵表，支持导出打印预览）
    'dc-feeding': { type: 'custom', render: 'renderDcFeedingPage', title: '加料记录' },
    // 批量采集编辑器（独立页面，不在侧边菜单显示）
    'dc-batch': { type: 'custom', render: 'renderDcBatchPage', title: '批量采集' },
    // 数据记录详情/编辑（独立页面，不在侧边菜单显示）
    'dc-view': { type: 'custom', render: 'renderDcViewPage', title: '数据记录详情' },
    // 数据管理趋势图（独立页面，不在侧边菜单显示）
    'dc-chart': { type: 'custom', render: 'renderDcChartPage', title: '数据趋势' },

    // ===== 系统管理 =====
    // 员工管理：账号数据（部门选项联动部门管理、角色选项联动角色管理）
    'sys-employee': { type: 'table', title: '员工管理',
        search: [{ name: 'username', label: '用户名', type: 'input', placeholder: '请输入用户名搜索' }, { name: 'dept', label: '部门', type: 'select', options: ['全部','管理部','生产部','设备部','质量部','技术部','仓储部'] }],
        buttons: [{ text: '添加', type: 'primary', action: 'add' }, { text: '刷新', type: 'default', action: 'refresh' }, { text: '导入', type: 'default', action: 'import' }, { text: '批量删除', type: 'danger', action: 'batchDelete' }],
        columns: [{ key: 'checkbox', label: '', type: 'checkbox' }, { key: 'username', label: '用户名' }, { key: 'name', label: '姓名' }, { key: 'phone', label: '联系电话' }, { key: 'dept', label: '部门' }, { key: 'role', label: '角色' }, { key: 'status', label: '状态', type: 'tag' }, { key: 'action', label: '操作', width: 320 }],
        data: [
            { username: 'admin', name: '管理员', phone: '13800000001', dept: '管理部', role: '超级管理员', status: '启用' },
            { username: 'zhangsan', name: '张三', phone: '13800000002', dept: '生产部', role: '生产主管', status: '启用' },
            { username: 'lisi', name: '李四', phone: '13800000003', dept: '设备部', role: '设备工程师', status: '启用' },
            { username: 'wangwu', name: '王五', phone: '13800000004', dept: '质量部', role: '质检员', status: '启用' },
            { username: 'zhaoliu', name: '赵六', phone: '13800000005', dept: '质量部', role: '质检员', status: '禁用' },
            { username: 'sunqi', name: '孙七', phone: '13800000006', dept: '仓储部', role: '仓管员', status: '启用' },
            { username: 'zhouba', name: '周八', phone: '13800000007', dept: '技术部', role: '工艺工程师', status: '启用' },
        ]
    },

    // 角色管理：permissions 为该角色可访问的功能模块（一级菜单 id + 二级页面 id），
    // 拥有该角色的账号登录后仅展示勾选的模块菜单（原型仅做数据层，不做真实鉴权）
    'sys-role': { type: 'table', title: '角色管理',
        search: [{ name: 'name', label: '名称', type: 'input', placeholder: '请输入名称搜索' }],
        buttons: [{ text: '添加', type: 'primary', action: 'add' }, { text: '刷新', type: 'default', action: 'refresh' }],
        columns: [{ key: 'name', label: '名称' }, { key: 'desc', label: '描述' }, { key: 'permText', label: '模块权限', width: 220 }, { key: 'action', label: '操作', width: 280 }],
        data: [
            { name: '超级管理员', desc: '系统最高权限，可管理所有模块', permText: '全部模块', permissions: 'all' },
            { name: '生产主管', desc: '生产管理权限，可管理订单和任务', permText: '首页 / 产品管理 / 生产管理 / 数据采集', permissions: ['dashboard', 'product', 'production', 'data-collect'] },
            { name: '设备工程师', desc: '设备管理权限，可管理设备和保养', permText: '首页 / 设备管理 / 保养计划 / 数据采集', permissions: ['dashboard', 'equipment', 'maintenance', 'data-collect'] },
            { name: '质检员', desc: '质检操作权限，可管理检验任务', permText: '首页 / 质检设置 / 质检任务', permissions: ['dashboard', 'qc-setting', 'qc-task'] },
            { name: '仓管员', desc: '库存管理权限，可管理出入库与预警', permText: '首页 / 库存管理', permissions: ['dashboard', 'inventory'] },
            { name: '工艺工程师', desc: '工艺技术权限，可管理工序与路线', permText: '首页 / 工序管理 / 质检设置', permissions: ['dashboard', 'process', 'qc-setting'] },
        ]
    },

    // 部门管理：部门基础信息（员工管理的部门下拉选项来源于此）
    'sys-dept': { type: 'table', title: '部门管理',
        search: [{ name: 'name', label: '名称', type: 'input', placeholder: '请输入名称搜索' }],
        buttons: [{ text: '添加', type: 'primary', action: 'add' }, { text: '刷新', type: 'default', action: 'refresh' }, { text: '导入', type: 'default', action: 'import' }, { text: '批量删除', type: 'danger', action: 'batchDelete' }],
        columns: [{ key: 'name', label: '名称' }, { key: 'desc', label: '描述' }, { key: 'action', label: '操作', width: 280 }],
        data: [
            { name: '管理部', desc: '公司管理层与行政管理' },
            { name: '生产部', desc: '涂装生产制造部门' },
            { name: '设备部', desc: '设备维护与保养部门' },
            { name: '质量部', desc: '质量检验与管控部门' },
            { name: '技术部', desc: '工艺技术与研发部门' },
            { name: '仓储部', desc: '物料仓储与出入库部门' },
        ]
    },

    'sys-log': { type: 'table', title: '操作日志',
        search: [{ name: 'user', label: '操作人', type: 'input' }, { name: 'startDate', label: '开始日期', type: 'input', placeholder: 'YYYY-MM-DD' }, { name: 'endDate', label: '结束日期', type: 'input', placeholder: 'YYYY-MM-DD' }],
        buttons: [{ text: '刷新', type: 'default', action: 'refresh' }, { text: '搜索', type: 'primary', action: 'search' }, { text: '重置', type: 'default', action: 'reset' }],
        columns: [{ key: 'user', label: '操作人' }, { key: 'module', label: '操作模块' }, { key: 'action', label: '操作内容' }, { key: 'ip', label: 'IP地址' }, { key: 'time', label: '操作时间' }, { key: 'status', label: '状态', type: 'tag' }],
        data: [
            { user: '管理员', module: '系统管理', action: '新增员工: zhaoliu', ip: '192.168.1.100', time: '2026-01-05 14:30:00', status: '成功' },
            { user: '张三', module: '生产管理', action: '新增生产订单: MO202601010001', ip: '192.168.1.101', time: '2026-01-05 10:00:00', status: '成功' },
            { user: '李四', module: '设备管理', action: '新增设备报修: RP20260101', ip: '192.168.1.102', time: '2026-01-03 10:05:00', status: '成功' },
            { user: '王五', module: '质检任务', action: '提交来料检验: IC20260101', ip: '192.168.1.103', time: '2026-01-02 10:30:00', status: '成功' },
        ]
    },
};

// ===== 库存运行时数据 =====
// 出入库流水（qty 正数=入库，负数=出库），保存单据/调整库存/删除单据时自动追加
const INV_STOCK_LOGS = [
    { productCode: 'YL002', time: '2026-08-22 14:20:00', qty: -15, reason: '其他出库（CK20260822001）', operator: '赵六' },
    { productCode: 'CP002', time: '2026-08-21 10:30:00', qty: 800, reason: '其他入库（RK20260821003）', operator: '李四' },
    { productCode: 'CP001', time: '2026-08-20 08:35:00', qty: 25, reason: '库存盘点调整（盘盈）', operator: 'admin' },
    { productCode: 'YJ001', time: '2026-08-19 16:40:00', qty: -38, reason: '其他出库（CK20260819001）', operator: '赵六' },
    { productCode: 'CP002', time: '2026-08-17 09:15:00', qty: -350, reason: '销售出库（XS20260817002）', operator: '李四' },
    { productCode: 'JH1824A', time: '2026-08-18 15:20:00', qty: -102, reason: '销售出库（XS20260818001）', operator: '赵六' },
    { productCode: 'CP001', time: '2026-08-15 11:30:00', qty: -25, reason: '其他出库（CK20260815002）', operator: '王五' },
    { productCode: 'YL002', time: '2026-08-13 10:00:00', qty: 100, reason: '其他入库（RK20260813001）', operator: '王五' },
    { productCode: 'JH1824A', time: '2026-08-14 10:10:00', qty: 160, reason: '其他入库（RK20260814003）', operator: '李四' },
    { productCode: 'CP002', time: '2026-08-11 13:25:00', qty: 800, reason: '其他入库（RK20260811002）', operator: '李四' },
    { productCode: 'CP001', time: '2026-08-12 14:05:00', qty: -180, reason: '销售出库（XS20260812001）', operator: '王五' },
    { productCode: 'CJ003', time: '2026-08-12 10:05:00', qty: -10, reason: '其他出库（CK20260812001）', operator: '王五' },
    { productCode: 'YJ001', time: '2026-08-16 09:00:00', qty: 50, reason: '其他入库（RK20260816001）', operator: '王五' },
    { productCode: 'CP001', time: '2026-08-10 09:20:00', qty: 500, reason: '其他入库（RK20260810001）', operator: 'admin' },
];

// 销售出库收货单位选项
const INV_PARTNERS = ['杭州湾汽配', '鼎结数智', '赛亦信息', '黑狐智造', '伟福汽车'];

// 预置历史预警记录（与实时联动预警混合展示）
const INV_ALERT_PRESET = [
    { productCode: 'CP001', productName: '汽车前保险杠', warehouseName: '成品仓', alertType: '库存不足', currentStock: 95, alertThreshold: 100, alertTime: '2026-08-20 08:30:00' },
    { productCode: 'YL002', productName: '固化剂', warehouseName: '原料仓', alertType: '库存不足', currentStock: 28, alertThreshold: 30, alertTime: '2026-08-18 09:12:00' },
    { productCode: 'JH1824A', productName: '短片', warehouseName: '成品仓', alertType: '库存过量', currentStock: 560, alertThreshold: 500, alertTime: '2026-08-15 16:40:00' },
];

// ===== 能耗管理运行时数据 =====
// 能耗类型（费用设置/初始能耗/能耗记录共用）
const ENERGY_TYPES = ['水', '电', '燃气'];
// 各类型单价（元/单位），费用设置页保存后实时影响能耗记录的当天费用
const ENERGY_PRICES = { '水': 3.85, '电': 1.05, '燃气': 3.20 };
// 初始表读数（首条能耗记录使用量计算的基准），初始能耗页保存后生效
const ENERGY_INITIAL = { '水': 51120, '电': 121870, '燃气': 31850 };

// ===== 数据采集运行时数据 =====
// 参与加料记录透视的分组（加料记录页可按分组筛选）
const DC_FEEDING_GROUPS = ['前处理药剂', '电泳槽液'];
// 加料记录签字人（按采集时间轮换，展示用）
const DC_FEEDING_SIGNERS = ['王建国', '李凤兰', '周德海'];

// 产品分类树结构
const PRODUCT_CATEGORIES = [
    { id: 'all', name: '全部', expandable: true, children: [
        { id: 'finished', name: '成品' },
        { id: 'semi', name: '半成品' },
        { id: 'raw', name: '原材料' },
    ]}
];

// 产品详情/编辑页面配置
const PRODUCT_DETAIL_CONFIG = {
    fields: {
        code: '产品编码', name: '产品名称', category: '产品分类', spec: '规格',
        material: '材质', weight: '重量', unit: '单位',
        defaultRoute: '默认工艺路线', enabled: '启用状态', remark: '备注',
        appearance: '外观', adhesion: '附着力', rackCode: '挂具编号', rackName: '挂具名称',
        thickness: '厚度', saltSpray: '盐雾', image: '图片', paint: '涂料',
    },
    editGroups: [
        { title: '基础信息', fields: [
            { name: 'code', label: '产品编码', type: 'input', required: true },
            { name: 'name', label: '产品名称', type: 'input', required: true },
            { name: 'category', label: '产品分类', type: 'select', required: true, options: ['成品','半成品','原材料'] },
            { name: 'spec', label: '规格', type: 'input' },
            { name: 'material', label: '材质', type: 'input' },
            { name: 'appearance', label: '外观', type: 'input' },
            { name: 'adhesion', label: '附着力', type: 'input' },
            { name: 'rackCode', label: '挂具编号', type: 'input' },
            { name: 'rackName', label: '挂具名称', type: 'input', fullWidth: true },
        ]},
        { title: '物理属性', fields: [
            { name: 'weight', label: '重量', type: 'number' },
            { name: 'unit', label: '单位', type: 'input' },
            { name: 'thickness', label: '厚度', type: 'input' },
            { name: 'saltSpray', label: '盐雾', type: 'input' },
            { name: 'image', label: '图片', type: 'upload', fullWidth: true },
        ]},
        { title: '涂料', fields: [
            { name: 'paint', label: '涂料', type: 'input' },
        ]},
        { title: '工艺配置', fields: [
            { name: 'defaultRoute', label: '默认工艺路线', type: 'select', options: ['来料检+过程检','来料检+过程检+成品检','来料检','过程检','成品检'] },
        ]},
        { title: '其他设置', fields: [
            { name: 'remark', label: '备注', type: 'textarea', fullWidth: true },
            { name: 'enabled', label: '启用状态', type: 'switch', value: true },
        ]},
    ],
};

// 表单配置：用于新增弹窗
const FORM_CONFIG = {
    'product-list': { title: '编辑产品', fields: [
        { name: 'code', label: '产品编码', type: 'input', required: true },
        { name: 'name', label: '产品名称', type: 'input', required: true },
        { name: 'category', label: '产品分类', type: 'select', options: ['成品','半成品','原材料'], required: true },
        { name: 'spec', label: '规格', type: 'input' },
        { name: 'material', label: '材质', type: 'input' },
    ]},
    'product-type': { title: '新增产品类型', fields: [
        { name: 'name', label: '类型名称', type: 'input', required: true },
        { name: 'parentType', label: '上级类型', type: 'select', options: ['无','涂装件','冲压件','注塑件'] },
    ]},
    'customer': { title: '新增客户', fields: [
        { name: 'name', label: '客户名称', type: 'input', required: true },
        { name: 'contact', label: '联系人', type: 'input', required: true },
        { name: 'phone', label: '联系电话', type: 'input' },
        { name: 'address', label: '地址', type: 'input' },
        { name: 'remark', label: '备注', type: 'textarea' },
    ]},
    'production-order': { title: '新增生产订单', fields: [
        { name: 'orderNo', label: '订单编号', type: 'input', required: true },
        { name: 'product', label: '产品', type: 'select', options: ['汽车前保险杠','发动机罩盖','车门饰条','散热器支架','后视镜外壳'], required: true },
        { name: 'quantity', label: '数量', type: 'input', required: true },
        { name: 'customer', label: '客户', type: 'select', options: ['宁波汽配','吉利汽车','比亚迪','上汽集团','长安汽车'] },
        { name: 'planStart', label: '计划开始', type: 'input', placeholder: 'YYYY-MM-DD' },
        { name: 'planEnd', label: '计划完成', type: 'input', placeholder: 'YYYY-MM-DD' },
    ]},
    'work-param': { title: '新增报工参数', fields: [
        { name: 'name', label: '参数名称', type: 'input', required: true },
        { name: 'code', label: '参数编码', type: 'input', required: true },
        { name: 'type', label: '参数类型', type: 'select', options: ['数值','百分比','文本'] },
        { name: 'unit', label: '单位', type: 'input' },
        { name: 'remark', label: '备注', type: 'textarea' },
    ]},
    'production-line': { title: '新增生产线', fields: [
        { name: 'name', label: '产线名称', type: 'input', required: true },
        { name: 'desc', label: '产线描述', type: 'textarea' },
        { name: 'enabled', label: '是否启用', type: 'switch', value: true },
    ]},
    'equipment-list': { title: '添加设备', fields: [
        { name: 'code', label: '设备编码', type: 'input', required: true },
        { name: 'name', label: '设备名称', type: 'input', required: true },
        { name: 'model', label: '设备型号', type: 'input' },
        { name: 'manufacturer', label: '制造厂商', type: 'input' },
        { name: 'factoryNo', label: '出厂编号', type: 'input' },
        { name: 'purchaseDate', label: '采购日期', type: 'date' },
        { name: 'price', label: '采购价格（元）', type: 'input', placeholder: '请输入金额' },
        { name: 'owner', label: '设备负责人', type: 'input' },
        { name: 'location', label: '安装位置', type: 'input' },
        { name: 'status', label: '设备状态', type: 'select', options: ['启用','停用','维修中','报废'] },
        { name: 'line', label: '所属产线', type: 'select', options: ['涂装测试生产线','涂装2号线','3323号产线'] },
        { name: 'techParam', label: '技术参数', type: 'textarea' },
        { name: 'images', label: '图片', type: 'image' },
        { name: 'remark', label: '备注', type: 'textarea' },
    ]},
    'equipment-repair': { title: '添加维修单', fields: [
        { name: 'repairNo', label: '维修单号', type: 'input', required: true },
        { name: 'equipment', label: '设备', type: 'select', options: ['前处理清洗机','静电喷涂机','固化炉','悬挂输送链','螺杆空压机','烘干室'], required: true },
        { name: 'reporter', label: '报修人', type: 'input', required: true },
        { name: 'repairType', label: '维修类型', type: 'select', options: ['机械维修','电气维修','保养维护','管道疏通'] },
        { name: 'urgent', label: '紧急程度', type: 'select', options: ['一般','紧急'] },
        { name: 'faultTime', label: '故障时间', type: 'datetime' },
        { name: 'faultPart', label: '设备部位', type: 'input' },
        { name: 'phone', label: '联系方式', type: 'input', placeholder: '请输入手机号' },
        { name: 'faultDesc', label: '故障描述', type: 'textarea' },
        { name: 'remark', label: '备注', type: 'textarea' },
    ]},
    'repair-type': { title: '添加维修类型', fields: [
        { name: 'typeName', label: '维修类型名称', type: 'input', required: true },
    ]},
    'work-process': { title: '添加工序', fields: [
        { name: 'code', label: '工序编码', type: 'input', required: true },
        { name: 'name', label: '工序名称', type: 'input', required: true },
        { name: 'desc', label: '工序描述', type: 'textarea' },
        { name: 'status', label: '状态', type: 'select', options: ['启用','停用'], required: true },
        { name: 'type', label: '工序类型', type: 'select', required: true,
          sourcePage: 'work-process-type', sourceKey: 'name', sourceStatusFilter: '启用' },
        { name: 'attachment', label: '附件上传', type: 'image' },
        { name: 'remark', label: '备注', type: 'textarea' },
    ]},
    'work-process-type': { title: '添加工序类型', fields: [
        { name: 'code', label: '类型编码', type: 'input', required: true },
        { name: 'name', label: '类型名称', type: 'input', required: true },
        { name: 'desc', label: '类型描述', type: 'textarea' },
        { name: 'status', label: '状态', type: 'select', options: ['启用','停用'], required: true },
        { name: 'remark', label: '备注', type: 'textarea' },
    ]},
    'process-route-type': { title: '添加工艺路线类型', fields: [
        { name: 'typeName', label: '类型名称', type: 'input', required: true },
        { name: 'remark', label: '备注', type: 'textarea' },
    ]},
    'defect-reason': { title: '添加不良原因', fields: [
        { name: 'name', label: '不良名称', type: 'input', required: true },
        { name: 'desc', label: '描述', type: 'textarea' },
    ]},
    'maintenance-item': { title: '新增保养项', fields: [
        { name: 'code', label: '保养项编码', type: 'input', required: true },
        { name: 'name', label: '保养项名称', type: 'input', required: true },
        { name: 'desc', label: '描述', type: 'textarea' },
        { name: 'status', label: '启用状态', type: 'select', options: ['启用','禁用'], required: true },
    ]},
    'inspection-item': { title: '新增点检项', fields: [
        { name: 'code', label: '点检项编码', type: 'input', required: true },
        { name: 'name', label: '点检项名称', type: 'input', required: true },
        { name: 'desc', label: '描述', type: 'textarea' },
        { name: 'status', label: '启用状态', type: 'select', options: ['启用','禁用'], required: true },
    ]},
    'qc-item': { title: '新增检验项目', fields: [
        { name: 'name', label: '项目名称', type: 'input', required: true },
        { name: 'valueType', label: '检验值类型', type: 'select', options: ['数值','文本','单选'], required: true },
        { name: 'method', label: '检验方法', type: 'input' },
        { name: 'standard', label: '检验标准', type: 'textarea' },
    ]},
    'dc-group': { title: '添加分组', fields: [
        { name: 'name', label: '分组名称', type: 'input', required: true },
    ]},
    'dc-standard': { title: '添加数据名称', fields: [
        { name: 'name', label: '名称', type: 'input', required: true, placeholder: '例如：电泳槽固体分' },
        { name: 'groupName', label: '所属分组', type: 'select', required: true, sourcePage: 'dc-group', sourceKey: 'name' },
        { name: 'lower', label: '下限值', type: 'input', required: true },
        { name: 'upper', label: '上限值', type: 'input', required: true },
        { name: 'unit', label: '单位', type: 'input', required: true, placeholder: '例如：%、℃、pH' },
        { name: 'remark', label: '备注', type: 'textarea' },
    ]},
    'sys-employee': { title: '添加员工', fields: [
        { name: 'username', label: '用户名', type: 'input', required: true },
        { name: 'name', label: '姓名', type: 'input', required: true },
        { name: 'phone', label: '联系电话', type: 'input' },
        { name: 'dept', label: '部门', type: 'select', options: ['生产部','质量部','设备部','管理部'] },
        { name: 'role', label: '角色', type: 'select', options: ['超级管理员','生产主管','设备工程师','质检员'] },
        { name: 'password', label: '初始密码', type: 'input', required: true },
        { name: 'enabled', label: '启用', type: 'switch', value: true },
    ]},
    'sys-role': { title: '新增角色', fields: [
        { name: 'name', label: '名称', type: 'input', required: true },
        { name: 'desc', label: '描述', type: 'textarea' },
    ]},
    'sys-dept': { title: '新增部门', fields: [
        { name: 'name', label: '名称', type: 'input', required: true },
        { name: 'desc', label: '描述', type: 'textarea' },
    ]},
};

// ============================================================
// 生产中心看板（首页-数据概览：ECharts 甘特图数据）
// 时间范围：2026-05-12 08:00 ~ 2026-05-15 24:00（周一至周四）
// 状态图例：生产中（蓝）/ 已完成（绿）/ 延期（橙）
// ============================================================
const PROD_BOARD_DATA = {
    // X 轴时间范围（起止时刻，8 小时一个刻度：08:00 / 16:00 / 24:00）
    timeStart: '2026-05-12T08:00:00',
    timeEnd: '2026-05-16T00:00:00',
    // Y 轴设备/工序列表（从上到下）
    devices: ['钢丝支架', 'MR后轮毂', '短片', '管件', '拉杆'],
    // 状态配色（与截图保持一致）
    statusColors: { '生产中': '#2b88f0', '已完成': '#22c55e', '延期': '#ffaa00' },
    // 工单任务条数据（完全写死的模拟数据：工单号/设备/起止时间/状态/数量）
    tasks: [
        { order: 'MO20260512001', device: '钢丝支架', start: '2026-05-12T08:00:00', end: '2026-05-12T20:00:00', status: '已完成', qty: 520, note: '按期完工' },
        { order: 'MO20260513001', device: '钢丝支架', start: '2026-05-13T08:00:00', end: '2026-05-14T12:00:00', status: '生产中', qty: 680, note: '电泳线正常生产' },
        { order: 'MO20260514005', device: '钢丝支架', start: '2026-05-14T16:00:00', end: '2026-05-15T12:00:00', status: '延期', qty: 300, note: '前工序来料延迟' },
        { order: 'MO20260512002', device: 'MR后轮毂', start: '2026-05-12T10:00:00', end: '2026-05-13T08:00:00', status: '已完成', qty: 450, note: '按期完工' },
        { order: 'MO20260513002', device: 'MR后轮毂', start: '2026-05-13T12:00:00', end: '2026-05-14T20:00:00', status: '已完成', qty: 560, note: '按期完工' },
        { order: 'MO20260515001', device: 'MR后轮毂', start: '2026-05-15T08:00:00', end: '2026-05-15T24:00:00', status: '生产中', qty: 400, note: '面漆线正常生产' },
        { order: 'MO20260512003', device: '短片', start: '2026-05-12T08:00:00', end: '2026-05-12T24:00:00', status: '已完成', qty: 900, note: '按期完工' },
        { order: 'MO20260513003', device: '短片', start: '2026-05-13T08:00:00', end: '2026-05-14T08:00:00', status: '延期', qty: 750, note: '设备换色停机 4 小时' },
        { order: 'MO20260514001', device: '短片', start: '2026-05-14T12:00:00', end: '2026-05-15T16:00:00', status: '生产中', qty: 620, note: '底漆线正常生产' },
        { order: 'MO20260513004', device: '管件', start: '2026-05-13T08:00:00', end: '2026-05-13T24:00:00', status: '已完成', qty: 380, note: '按期完工' },
        { order: 'MO20260514002', device: '管件', start: '2026-05-14T08:00:00', end: '2026-05-15T08:00:00', status: '生产中', qty: 420, note: '喷涂二线正常生产' },
        { order: 'MO20260515002', device: '管件', start: '2026-05-15T12:00:00', end: '2026-05-15T24:00:00', status: '生产中', qty: 260, note: '计划排产' },
        { order: 'MO20260512004', device: '拉杆', start: '2026-05-12T12:00:00', end: '2026-05-13T12:00:00', status: '延期', qty: 540, note: '挂具短缺待料' },
        { order: 'MO20260514003', device: '拉杆', start: '2026-05-14T08:00:00', end: '2026-05-14T24:00:00', status: '已完成', qty: 480, note: '按期完工' },
        { order: 'MO20260515003', device: '拉杆', start: '2026-05-15T08:00:00', end: '2026-05-15T20:00:00', status: '生产中', qty: 350, note: '电泳线正常生产' },
    ],
};

// 看板数据
const DASHBOARD_DATA = {
    stats: [
        { label: '今日订单', value: 12, icon: '📋', color: '#1890ff', trend: '+3' },
        { label: '进行中', value: 8, icon: '🔄', color: '#faad14', trend: '+1' },
        { label: '紧急订单', value: 2, icon: '⚠️', color: '#ff4d4f', trend: '0' },
        { label: '已完成', value: 5, icon: '✅', color: '#52c41a', trend: '+2' },
    ],
    weeklyChart: [
        { day: '周一', value: 120 },
        { day: '周二', value: 180 },
        { day: '周三', value: 150 },
        { day: '周四', value: 220 },
        { day: '周五', value: 200 },
        { day: '周六', value: 90 },
        { day: '周日', value: 60 },
    ],
    defectReasons: [
        { name: '表面划伤', count: 8, percentage: 40 },
        { name: '色差', count: 5, percentage: 25 },
        { name: '厚度不足', count: 4, percentage: 20 },
        { name: '流挂', count: 2, percentage: 10 },
        { name: '其他', count: 1, percentage: 5 },
    ],
    orderExpiry: [
        { orderNo: 'MO202601010001', product: '汽车前保险杠', daysLeft: 2, status: '紧急' },
        { orderNo: 'MO202601050005', product: '后视镜外壳', daysLeft: 5, status: '正常' },
        { orderNo: 'MO202601020002', product: '发动机罩盖', daysLeft: 10, status: '正常' },
    ],
    todayReports: [
        { reporter: '张三', process: '前处理', product: '汽车前保险杠', qty: 320, defectQty: 3, time: '17:00' },
        { reporter: '王五', process: '包装', product: '车门饰条', qty: 500, defectQty: 0, time: '16:30' },
        { reporter: '李四', process: '喷涂', product: '后视镜外壳', qty: 150, defectQty: 1, time: '16:00' },
    ],
};
