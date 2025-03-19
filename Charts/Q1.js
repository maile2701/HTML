const margin = { top: 50, right: 200, bottom: 100, left: 300 },
      width = 1400 - margin.left - margin.right,
      height = 800 - margin.top - margin.bottom;

// Tạo vùng vẽ SVG
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Tạo tooltip
const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("visibility", "hidden");

d3.csv("data.csv").then(data => {
    data.forEach(d => {
        d["Thành tiền"] = +d["Thành tiền"];
        d["SL"] = +d["SL"];
    });

    let doanhSoTheoMatHang = d3.rollup(
        data,
        v => ({
            doanhSo: d3.sum(v, d => d["Thành tiền"]),
            soLuong: d3.sum(v, d => d["SL"]),
            nhomHang: v[0]["Mã nhóm hàng"],
            tenNhomHang: v[0]["Tên nhóm hàng"]
        }),
        d => `[${d["Mã mặt hàng"]}] ${d["Tên mặt hàng"]}`
    );

    let doanhSoData = Array.from(doanhSoTheoMatHang, ([key, value]) => ({
        TenMatHang: key,
        TongDoanhSo: value.doanhSo,
        TongSoLuong: value.soLuong,
        MaNhomHang: value.nhomHang,
        TenNhomHang: value.tenNhomHang
    }));

    doanhSoData.sort((a, b) => b.TongDoanhSo - a.TongDoanhSo);

    // Tạo ánh xạ mã nhóm hàng với tên nhóm hàng
    let nhomHangMap = new Map();
    doanhSoData.forEach(d => {
        if (!nhomHangMap.has(d.MaNhomHang)) {
            nhomHangMap.set(d.MaNhomHang, `[${d.MaNhomHang}] ${d.TenNhomHang}`);
        }
    });

    // Bảng màu cố định theo nhóm hàng dựa trên legend
    const colorScale = d3.scaleOrdinal()
        .domain([...nhomHangMap.keys()])
        .range(["#4B78A7", "#E78B41", "#D94F4F", "#76A6A6", "#6C9640"]);

    const x = d3.scaleLinear()
        .domain([0, d3.max(doanhSoData, d => d.TongDoanhSo)])
        .range([0, width - 100]);

    const y = d3.scaleBand()
        .domain(doanhSoData.map(d => d.TenMatHang))
        .range([0, height])
        .padding(0.2);

    svg.selectAll(".bar")
        .data(doanhSoData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("y", d => y(d.TenMatHang))
        .attr("width", d => x(d.TongDoanhSo))
        .attr("height", y.bandwidth())
        .attr("fill", d => colorScale(d.MaNhomHang)) // 🔹 Đảm bảo màu trùng với legend
        .on("mouseover", (event, d) => {
            tooltip.style("visibility", "visible")
                   .html(`
                        <b>Mặt hàng:</b> ${d.TenMatHang}<br>
                        <b>Nhóm hàng:</b> [${d.MaNhomHang}] ${d.TenNhomHang}<br>
                        <b>Doanh số bán:</b> ${d3.format(",")(d.TongDoanhSo)} VNĐ<br>
                        <b>Số lượng bán:</b> ${d3.format(",")(d.TongSoLuong)} SKUs
                    `);
        })
        .on("mousemove", event => {
            tooltip.style("top", (event.pageY - 10) + "px")
                   .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", () => tooltip.style("visibility", "hidden"));

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(6).tickFormat(d => d3.format(".2s")(d).replace('M', 'M').replace('G', 'B')))
        .selectAll("text")
        .style("text-anchor", "middle");

    svg.append("g")
        .call(d3.axisLeft(y));

    // Thêm phần chú thích (Legend)
    const legend = svg.append("g")
        .attr("transform", `translate(${width + 50}, 0)`);

    legend.append("text")
        .attr("x", 0)
        .attr("y", -10)
        .style("font-weight", "bold")
        .text("Nhóm hàng");

    let legendEntries = [...nhomHangMap.entries()];
    legendEntries.forEach((d, i) => {
        legend.append("rect")
            .attr("x", 0)
            .attr("y", i * 25)
            .attr("width", 14)
            .attr("height", 14)
            .attr("fill", colorScale(d[0]));

        legend.append("text")
            .attr("x", 20)
            .attr("y", i * 25 + 10)
            .style("font-size", "14px")
            .text(d[1]); // Sử dụng format [Mã nhóm hàng] Tên nhóm hàng
    });
});
