# World GDP Circle Packing — Challenge 2

这是 Challenge 2 的圆形版本。网站继续使用世界银行真实 GDP 数据，但把矩形 Treemap 改成了层级圆形打包图。打开后可以同时看到六大洲圆和大洲内部的国家圆，点击大洲圆或任意国家圆可以放大查看该洲。它不需要安装复杂工具，也不需要 API Key。

## 每个文件是做什么的

- `index.html`：网页的文字、按钮和整体结构。
- `style.css`：网页的颜色、大小、间距和手机适配。
- `script.js`：读取世界银行数据、按 ISO3 代码划分大洲，并使用 `d3.pack()` 绘制“世界—大洲—国家”的可下钻圆形打包图。
- `README.md`：也就是你正在看的使用说明。

## 如何在 VS Code 中安装 Live Server

1. 打开 VS Code。
2. 点击左侧像四个方块一样的“扩展”按钮。
3. 在搜索框输入 `Live Server`。
4. 找到作者为 **Ritwick Dey** 的 Live Server，点击“安装”。

## 如何打开网站

1. 在 VS Code 左侧文件列表中打开 `index.html`。
2. 在 `index.html` 编辑区域中点击鼠标右键。
3. 点击 **Open with Live Server**。
4. 浏览器会自动打开网站。第一次读取世界银行数据时，请稍等几秒。

不要直接双击 `index.html` 打开。使用 Live Server 更稳定，也更容易排查问题。

## 页面没有显示数据时检查什么

1. 确认电脑可以访问互联网。
2. 确认你是用 Live Server 打开的，而不是直接双击 HTML 文件。
3. 检查浏览器是否能访问世界银行 API：
   - [GDP 数据接口](https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.CD?format=json&date=2000:2025&per_page=20000)
   - [国家信息接口](https://api.worldbank.org/v2/country?format=json&per_page=400)
4. 如果公司或学校网络屏蔽了外部接口，可以换一个网络再试。
5. 页面出现错误提示时，点击“重新加载”。

## 最容易修改的三个位置

### 修改标题

打开 `index.html`，找到：

```html
<h1>World GDP Circle Packing</h1>
```

把中间的文字换成你想要的标题。

### 修改大洲颜色

打开 `script.js`，在最上方找到 `CONTINENT_COLOR_RANGES`。例如：

```js
Asia: { light: "#f1ad91", dark: "#a83b25" }
```

`light` 是该洲低 GDP 国家的浅色，`dark` 是高 GDP 国家的深色。六个大洲各有一个固定色相。

### 修改默认年份

打开 `script.js`，找到：

```js
const PREFERRED_DEFAULT_YEAR = null;
```

- 保持 `null`：自动选择“至少有 100 个国家有数据”的最新年份。
- 改成 `2022`：优先显示 2022 年（只要 API 中存在这一年的有效数据）。

## 怎样阅读 Circle Packing

Circle Packing 会把层级数据排成许多互不重叠、彼此包含的圆：

- 最外层圆代表当前显示范围；总览中的大圆代表大洲，内部小圆代表该洲的国家或经济体。
- 国家圆的面积由真实 GDP 决定；圆越大，GDP 越高。
- 同一个大洲内，GDP 越高颜色越深，GDP 越低颜色越浅。不同大洲使用不同基础色相。
- 点击大洲圆或任意国家圆会进入该洲详情；国家会在同一个图表区域中放大。
- 把鼠标移到圆上，可以看到完整 GDP、简写 GDP 和占比。
- 点击 `World` 面包屑或 `← Back to Continents` 按钮，可以返回包含所有国家的六大洲总览。
- 切换年份后会保留当前层级，并重新计算面积。

## 数据说明

- 指标：GDP (current US$)
- 指标代码：`NY.GDP.MKTP.CD`
- 来源：[世界银行开放数据](https://data.worldbank.org/indicator/NY.GDP.MKTP.CD)
- 页面会自动排除 World、地区合计、收入组等 Aggregate 汇总项目，并去掉空值、0 和无效值。
- 国家所属大洲来自 `script.js` 中本地保存的 ISO3 映射，不依赖第三个在线分类接口。
