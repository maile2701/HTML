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

    // Tổng hợp doanh thu và số lượng theo nhóm hàng
    let doanhSoTheoNhomHang = d3.rollup(
        data,
        v => ({
            doanhSo: d3.sum(v, d => d["Thành tiền"]),
            soLuong: d3.sum(v, d => d["SL"]),
            tenNhomHang: v[0]["Tên nhóm hàng"]
        }),
        d => d["Mã nhóm hàng"]
    );

    let doanhSoData = Array.from(doanhSoTheoNhomHang, ([maNhomHang, value]) => ({
        MaNhomHang: maNhomHang,
        TenNhomHang: value.tenNhomHang,
        TongDoanhSo: value.doanhSo,
        TongSoLuong: value.soLuong
    }));

    // Sắp xếp giảm dần theo doanh số
    doanhSoData.sort((a, b) => b.TongDoanhSo - a.TongDoanhSo);

    // Bảng màu cố định theo nhóm hàng
    const colorScale = d3.scaleOrdinal()
        .domain(doanhSoData.map(d => d.MaNhomHang))
        .range(["#4B78A7", "#E78B41", "#D94F4F", "#76A6A6", "#6C9640"]);

    const x = d3.scaleLinear()
        .domain([0, d3.max(doanhSoData, d => d.TongDoanhSo)])
        .range([0, width - 100]);

    const y = d3.scaleBand()
        .domain(doanhSoData.map(d => `[${d.MaNhomHang}] ${d.TenNhomHang}`))
        .range([0, height])
        .padding(0.2);

    // Vẽ các thanh bar
    svg.selectAll(".bar")
        .data(doanhSoData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("y", d => y(`[${d.MaNhomHang}] ${d.TenNhomHang}`))
        .attr("width", d => x(d.TongDoanhSo))
        .attr("height", y.bandwidth())
        .attr("fill", d => colorScale(d.MaNhomHang)) // Màu sắc theo nhóm hàng
        .on("mouseover", (event, d) => {
            tooltip.style("visibility", "visible")
                   .html(`
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

    // Thêm giá trị doanh số trên mỗi thanh bar
    svg.selectAll(".label")
        .data(doanhSoData)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => x(d.TongDoanhSo) + 10)
        .attr("y", d => y(`[${d.MaNhomHang}] ${d.TenNhomHang}`) + y.bandwidth() / 2)
        .attr("dy", ".35em")
        .text(d => d3.format(",.0f")(d.TongDoanhSo / 1000000) + " triệu VNĐ");

    // Trục X
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(6).tickFormat(d => d3.format(".2s")(d).replace('M', ' triệu').replace('G', ' tỷ')))
        .selectAll("text")
        .style("text-anchor", "middle");

    // Trục Y
    svg.append("g")
        .call(d3.axisLeft(y));

});
