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
        d["Thời gian tạo đơn"] = new Date(d["Thời gian tạo đơn"]); // Chuyển sang dạng Date
    });

    // Tính tổng doanh số theo khung giờ (0:00-0:59, 1:00-1:59, ..., 23:00-23:59)
    let doanhSoTheoGio = d3.rollup(
        data,
        v => ({
            doanhSo: d3.sum(v, d => d["Thành tiền"]) / 365, // Chia cho 365 ngày để lấy trung bình
            soLuong: d3.sum(v, d => d["SL"])
        }),
        d => d["Thời gian tạo đơn"].getHours() // Lấy giờ trong ngày (0 - 23)
    );

    let doanhSoData = Array.from(doanhSoTheoGio, ([key, value]) => ({
        Gio: key,
        DoanhThuTrungBinh: value.doanhSo,
        SLTrungBinh: value.soLuong
    })).sort((a, b) => a.Gio - b.Gio); // Sắp xếp theo thứ tự giờ trong ngày

    // Danh sách khung giờ
    const khungGio = Array.from({ length: 24 }, (_, i) => `${i}:00-${i}:59`);

    // Thang màu cho từng cột
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    // Thang đo trục X (Khung giờ)
    const x = d3.scaleBand()
        .domain(doanhSoData.map(d => khungGio[d.Gio]))
        .range([0, width])
        .padding(0.2);

    // Thang đo trục Y (Doanh số trung bình)
    const y = d3.scaleLinear()
        .domain([0, d3.max(doanhSoData, d => d.DoanhThuTrungBinh)])
        .range([height, 0]);

    // Vẽ thanh bar với mỗi cột 1 màu khác nhau
    svg.selectAll(".bar")
        .data(doanhSoData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(khungGio[d.Gio]))
        .attr("y", d => y(d.DoanhThuTrungBinh))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.DoanhThuTrungBinh))
        .attr("fill", d => colorScale(d.Gio)) // Mỗi cột có một màu khác nhau
        .on("mouseover", (event, d) => {
            tooltip.style("visibility", "visible")
                   .html(`
                        <b>Khung giờ:</b> ${khungGio[d.Gio]}<br>
                        <b>Doanh thu trung bình:</b> ${d3.format(",")(d.DoanhThuTrungBinh)} VNĐ <br>
                        <b>Số lượng bán trung bình:</b> ${d3.format(",")(d.SLTrungBinh)} SKUs
                    `);
        })
        .on("mousemove", event => {
            tooltip.style("top", (event.pageY - 10) + "px")
                   .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", () => tooltip.style("visibility", "hidden"));

    // Hiển thị doanh thu trên thanh bar
    svg.selectAll(".label")
        .data(doanhSoData)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => x(khungGio[d.Gio]) + x.bandwidth() / 2)
        .attr("y", d => y(d.DoanhThuTrungBinh) - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "#000")
        .style("font-weight", "bold")
        .text(d => d3.format(",.0f")(d.DoanhThuTrungBinh) + "VNĐ");

    // Trục X (Khung giờ)
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    // Trục Y (Doanh số trung bình)
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
