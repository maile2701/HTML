const margin = { top: 30, right: 50, bottom: 40, left: 60 },
      width = 500 - margin.left - margin.right,
      height = 350 - margin.top - margin.bottom;

const container = d3.select("#chart")
    .style("display", "flex")
    .style("flex-wrap", "wrap")
    .style("gap", "40px");

// Tạo tooltip
const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("visibility", "hidden");

d3.csv("data.csv").then(data => {
    data.forEach(d => {
        d["Số lượng"] = +d["Số lượng"];
        d["Thời gian tạo đơn"] = new Date(d["Thời gian tạo đơn"]);
        d["Tháng"] = d["Thời gian tạo đơn"].getMonth() + 1;
    });

    let nhomHangMap = d3.group(data, d => d["Mã nhóm hàng"]);

    nhomHangMap.forEach((donHang, maNhomHang) => {
        let tenNhomHang = donHang[0]["Tên nhóm hàng"];

        let tongDonTheoThang = new Map();
        let matHangTheoThang = new Map();

        donHang.forEach(d => {
            let thang = d["Tháng"];
            let maMatHang = d["Mã mặt hàng"];
            let tenMatHang = d["Tên mặt hàng"];

            if (!tongDonTheoThang.has(thang)) {
                tongDonTheoThang.set(thang, new Set());
            }
            tongDonTheoThang.get(thang).add(d["Mã đơn hàng"]);

            if (!matHangTheoThang.has(maMatHang)) {
                matHangTheoThang.set(maMatHang, { ten: tenMatHang, thangData: new Map() });
            }
            if (!matHangTheoThang.get(maMatHang).thangData.has(thang)) {
                matHangTheoThang.get(maMatHang).thangData.set(thang, new Set());
            }
            matHangTheoThang.get(maMatHang).thangData.get(thang).add(d["Mã đơn hàng"]);
        });

        let xacSuatData = [];
        matHangTheoThang.forEach((matHang, maMatHang) => {
            let lineData = [];
            tongDonTheoThang.forEach((tongDon, thang) => {
                let soDonMatHang = matHang.thangData.get(thang)?.size || 0;
                let xacSuat = soDonMatHang / tongDon.size;
                lineData.push({ Thang: thang, XacSuat: xacSuat, SoLuongDon: soDonMatHang, TenMatHang: matHang.ten });
            });

            xacSuatData.push({ TenMatHang: matHang.ten, LineData: lineData });
        });

        const thangArray = Array.from(tongDonTheoThang.keys()).sort(d3.ascending);

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

        const colorScale = d3.scaleOrdinal()
            .domain(xacSuatData.map(d => d.TenMatHang))
            .range(d3.schemeCategory10);

        const x = d3.scalePoint()
            .domain(thangArray)
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(xacSuatData, d => d3.max(d.LineData, v => v.XacSuat))])
            .range([height, 0]);

        const line = d3.line()
            .x(d => x(d.Thang))
            .y(d => y(d.XacSuat))
            .curve(d3.curveMonotoneX);

        svg.selectAll(".line-group")
            .data(xacSuatData)
            .enter()
            .append("g")
            .attr("class", "line-group")
            .append("path")
            .attr("class", "line")
            .attr("d", d => line(d.LineData))
            .style("fill", "none")
            .style("stroke", d => colorScale(d.TenMatHang))
            .style("stroke-width", 2);

        svg.selectAll(".dot-group")
            .data(xacSuatData)
            .enter()
            .append("g")
            .attr("class", "dot-group")
            .selectAll(".dot")
            .data(d => d.LineData)
            .enter()
            .append("circle")
            .attr("class", "dot")
            .attr("cx", d => x(d.Thang))
            .attr("cy", d => y(d.XacSuat))
            .attr("r", 3)
            .style("fill", d => colorScale(d.TenMatHang))
            .on("mouseover", (event, d) => {
                tooltip.style("visibility", "visible")
                       .html(`
                            <b>Tháng:</b> ${d.Thang}<br>
                            <b>Mặt hàng:</b> ${d.TenMatHang}<br>
                            <b>Số lượng đơn bán:</b> ${d.SoLuongDon.toLocaleString()}<br>
                            <b>Xác suất bán:</b> ${(d.XacSuat * 100).toFixed(1)}%
                        `);
            })
            .on("mousemove", event => {
                tooltip.style("top", (event.pageY - 10) + "px")
                       .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", () => tooltip.style("visibility", "hidden"));

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickFormat(d => `T${d}`))
            .selectAll("text")
            .style("text-anchor", "middle");

        svg.append("g")
            .call(d3.axisLeft(y).ticks(4).tickFormat(d3.format(".0%")));
    });
});
