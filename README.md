# World GDP Treemap

这是一个用世界银行真实数据制作的 GDP 矩形树图网站。它不需要安装复杂工具，也不需要 API Key。

## 每个文件是做什么的

- `index.html`：网页的文字、按钮和整体结构。
- `style.css`：网页的颜色、大小、间距和手机适配。
- `script.js`：读取世界银行数据、整理国家信息并绘制 Treemap。
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
<h1>World GDP Treemap</h1>
```

把中间的文字换成你想要的标题。

### 修改地区颜色

打开 `script.js`，在最上方找到 `REGION_COLORS`。例如：

```js
"East Asia & Pacific": "#4f87bd"
```

后面的 `#4f87bd` 就是颜色，可以换成其他十六进制颜色。

### 修改默认年份

打开 `script.js`，找到：

```js
const PREFERRED_DEFAULT_YEAR = null;
```

- 保持 `null`：自动选择“至少有 100 个国家有数据”的最新年份。
- 改成 `2022`：优先显示 2022 年（只要 API 中存在这一年的有效数据）。

## 怎样阅读 Treemap

Treemap 就像把一整块空间分成许多大小不同的矩形：

- 一个矩形代表一个国家或经济体。
- 矩形越大，说明这个国家的 GDP 越高。
- 颜色表示这个国家属于哪个世界银行地区，页面下方的图例说明每种颜色的含义。
- 把鼠标移到矩形上，可以看到国家代码、完整 GDP、简写 GDP 和占总额的比例。
- 切换年份后，可以观察各国 GDP 规模的相对变化。

## 数据说明

- 指标：GDP (current US$)
- 指标代码：`NY.GDP.MKTP.CD`
- 来源：[世界银行开放数据](https://data.worldbank.org/indicator/NY.GDP.MKTP.CD)
- 页面会自动排除 World、地区合计、收入组等 Aggregate 汇总项目，并去掉空值、0 和无效值。
