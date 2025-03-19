const margin = { top: 30, right: 30, bottom: 40, left: 50 };
const width = Math.min(400, window.innerWidth / 3 - margin.left - margin.right);
const height = 250 - margin.top - margin.bottom;

const container = d3.select("#chart")
    .style("display", "flex")
    .style("flex-wrap", "wrap")
    .style("gap", "40px");

const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("visibility", "hidden");

d3.csv("data.csv").then(data => {
    data.forEach(d => {
        d["Số lượng"] = +d["Số lượng"];
    });

    let nhomHangMap = d3.group(data, d => d["Mã nhóm hàng"]);

    nhomHangMap.forEach((donHang, maNhomHang) => {
        let tenNhomHang = donHang[0]["Tên nhóm hàng"];

        let tongDonNhom = new Set(donHang.map(d => d["Mã đơn hàng"])).size;
        let matHangData = d3.rollups(donHang,
            v => new Set(v.map(d => d["Mã đơn hàng"])).size / tongDonNhom,
            d => d["Tên mặt hàng"]
        ).map(([tenMatHang, xacSuat]) => ({ tenMatHang, xacSuat }));

        const chartDiv = container.append("div")
            .attr("class", "chart-group")
            .style("width", `${width + margin.left + margin.right}px`);

        chartDiv.append("h4")
            .style("text-align", "center")
            .style("margin-bottom", "5px")
            .text(`[${maNhomHang}] ${tenNhomHang}`);

        const svg = chartDiv.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleBand()
            .domain(matHangData.map(d => d.tenMatHang))
            .range([0, width])
            .padding(0.4);  // 🔹 Giúp thanh bar rộng hơn

        const y = d3.scaleLinear()
            .domain([0, Math.max(0.1, d3.max(matHangData, d => d.xacSuat))])  
            .range([height, 0]);

        const colorScale = d3.scaleOrdinal()
            .domain(matHangData.map(d => d.tenMatHang))
            .range(d3.schemeTableau10);

        svg.selectAll(".bar")
            .data(matHangData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.tenMatHang))
            .attr("y", d => y(d.xacSuat))
            .attr("width", x.bandwidth())
            .attr("height", d => Math.max(5, height - y(d.xacSuat)))  
            .style("fill", d => colorScale(d.tenMatHang))
            .on("mouseover", (event, d) => {
                tooltip.style("visibility", "visible")
                       .html(`<b>${d.tenMatHang}</b><br>Xác suất: ${(d.xacSuat * 100).toFixed(1)}%`);
            })
            .on("mousemove", event => {
                tooltip.style("top", (event.pageY - 10) + "px")
                       .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", () => tooltip.style("visibility", "hidden"));

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickFormat(d => d.length > 10 ? d.slice(0, 10) + "..." : d))
            .selectAll("text")
            .style("text-anchor", "middle");

        svg.append("g")
            .call(d3.axisLeft(y).ticks(4).tickFormat(d3.format(".0%")));
    });
});
