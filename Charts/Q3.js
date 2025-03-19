const margin = { top: 50, right: 50, bottom: 100, left: 100 },
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
        d["Thời gian tạo đơn"] = new Date(d["Thời gian tạo đơn"]); // Chuyển đổi sang dạng Date
    });

    // Tính tổng doanh thu và tổng số lượng bán theo tháng
    let doanhSoTheoThang = d3.rollup(
        data,
        v => ({
            doanhSo: d3.sum(v, d => d["Thành tiền"]),
            soLuong: d3.sum(v, d => d["SL"])
        }),   
        d => d["Thời gian tạo đơn"].getMonth() + 1 
    );

    let doanhSoData = Array.from(doanhSoTheoThang, ([key, value]) => ({
        Thang: key,
        TongDoanhSo: value.doanhSo,  // ✅ Doanh số bán
        TongSoLuong: value.soLuong   // ✅ Số lượng bán
    })).sort((a, b) => a.Thang - b.Thang); // Sắp xếp theo tháng tăng dần

    // Thang đo màu sắc cho từng tháng
    const colorScale = d3.scaleOrdinal()
        .domain(doanhSoData.map(d => d.Thang))
        .range(d3.schemeTableau10); // Bộ màu Tableau10 của D3.js

    // Thang đo trục X (Tháng)
    const x = d3.scaleBand()
        .domain(doanhSoData.map(d => `Tháng ${d.Thang}`))
        .range([0, width])
        .padding(0.2);

    // Thang đo trục Y (Doanh số)
    const y = d3.scaleLinear()
        .domain([0, d3.max(doanhSoData, d => d.TongDoanhSo)])
        .range([height, 0]);

    // Vẽ thanh bar
    svg.selectAll(".bar")
        .data(doanhSoData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(`Tháng ${d.Thang}`))
        .attr("y", d => y(d.TongDoanhSo))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.TongDoanhSo))
        .attr("fill", d => colorScale(d.Thang)) // Màu sắc theo tháng
        .on("mouseover", (event, d) => {
            tooltip.style("visibility", "visible")
                   .html(`
                        <b>Tháng:</b> ${d.Thang}<br>
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
        .attr("x", d => x(`Tháng ${d.Thang}`) + x.bandwidth() / 2) // Căn giữa thanh
        .attr("y", d => y(d.TongDoanhSo) - 5) // Hiển thị phía trên thanh bar
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "#000")
        .style("font-weight", "bold")
        .text(d => d3.format(",.0f")(d.TongDoanhSo / 1000000) + " triệu VNĐ");

    // Trục X (Tháng)
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("text-anchor", "middle");

    // Trục Y (Doanh số)
    svg.append("g")
        .call(d3.axisLeft(y).ticks(6).tickFormat(d => d3.format(".2s")(d).replace('M', 'M').replace('G', 'B')));

    // Thêm tiêu đề biểu đồ
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
});
