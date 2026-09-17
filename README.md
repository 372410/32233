# 专属于涂装行业的MES系统原型设计
> 面向电泳、磷化涂装车间的全流程MES原型项目，复刻真实MES项目从需求调研→蓝图设计→系统实现→交付验收的完整实施周期，覆盖生产执行、质量追溯、设备运维、工业看板、移动端现场作业场景。

 **项目亮点**
- **垂直行业深度**：基于涂装工厂工序设计，覆盖前处理→磷化→电泳→固化全工艺段
- **三端完整方案**：Web管理端 + 现场移动端 + 车间数字大屏，覆盖计划员、班组长、操作工、管理层角色
- **完整交付闭环**：配套类标准项目交付文档，高度还原MES实施项目输出物体系
- **可落地性强**：对涂装车间磷化、电泳工艺，模拟多工位产线，解决工单下发、生产进度跟踪、设备异常告警、产量能耗统计，支持班组长Web端管理、计划员下发任务，现场工人移动端（PDA+手机）扫码报工操作、大屏展示生产数据。基于客户需求完成快速原型设计和工业看板设计。

## 🔗在线演示地址
- Web管理端原型设计地址：https://372410.github.io/32233/
- 移动端现场作业：https://372410.github.io/32233/mobile/
- 工业BI看板：https://372410.github.io/32233/BI/


## 实现方式
- 前端：HTML / JavaScript / CSS
- 图表：ECharts

## Web端功能模块图
<img width="3400" height="3300" alt="mes-module-mind" src="https://github.com/user-attachments/assets/84cf9c3a-2d77-4f14-8d28-3acff236efa1" />

## 📁项目交付物
> [交付文档文件夹](./deliverable/)
- [系统界面截图集](./screenshot/screenshot.md)
- [工艺流转卡.PDF下载](https://raw.githubusercontent.com/372410/32233/main/docs/工艺流转卡.pdf)
- [项目流程交付文件集](./docs/PDF.md)
- [涂装MES生产管理系统操作手册](./docs/涂装MES生产管理系统操作手册.docx)
- [系统流程图]




## 🧪涂装工艺说明
本原型基于真实电泳涂装产线设计，工艺主要分为4段：
1. **前处理脱脂段**：上件→热水洗→预脱脂→主脱脂，去除工件表面油污
2. **磷化表调段**：水洗→表调→磷化，形成磷化膜提升附着力
3. **电泳涂装段**：纯水洗→电泳→UF超滤，完成电泳上漆
4. **烘干固化段**：预烘干→固化→下件，漆膜固化成型
<p align="center">
<img src="https://cdn.jsdelivr.net/gh/372410/32233@main/screenshot/工厂涂装业务ABC线.png" width="720" alt="工厂涂装业务ABC线">

> 涂装完整工艺说明见 [涂装工艺说明](涂装工艺说明.md)

## ✨ 核心界面精选
### 生产监控大屏
通过数字化监控中心集中展示涂装工厂的工序数据和物料流转，包含产量、合格率、设备状态、工单进度、工艺参数和质量趋势，为生产管理提供可视化决策支持。

<p align="center">
<img src="https://cdn.jsdelivr.net/gh/372410/32233@main/screenshot/工业看板.png" width="720" alt="生产监控大屏">
</p>

### 移动端业务界面
<table align="center" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center">
      <img src="https://cdn.jsdelivr.net/gh/372410/32233@main/screenshot/移动端-质量检验.png" width="350" alt="移动质检界面">
      <div>Web端 · 产品管理</div>
    </td>
    <td align="center">
      <img src="https://cdn.jsdelivr.net/gh/372410/32233@main/screenshot/移动端-首页.png" width="350" alt="移动端首页">
      <div>移动端 · 首页看板</div>
    </td>
  </tr>
</table>

### web端业务界面
<p align="center">
<img src="https://cdn.jsdelivr.net/gh/372410/32233@main/screenshot/首页-数据概览.png" width="720" alt="首页数据概览界面">
</p>
---












