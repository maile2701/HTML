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

    // Tính tổng doanh số theo Ngày trong tháng (1 - 31)
    let doanhSoTheoNgayTrongThang = d3.rollup(
        data,
        v => ({
            doanhSo: d3.sum(v, d => d["Thành tiền"]) / 12, // Chia cho 12 tháng để lấy trung bình
            soLuong: d3.sum(v, d => d["SL"])
        }),
        d => d["Thời gian tạo đơn"].getDate() // Lấy ngày trong tháng (1 - 31)
    );

    let doanhSoData = Array.from(doanhSoTheoNgayTrongThang, ([key, value]) => ({
        NgayofThang: key,
        DoanhThuTrungBinh: value.doanhSo,
        SLTrungBinh: value.soLuong
    })).sort((a, b) => a.NgayofThang - b.NgayofThang);

    // Thang đo màu sắc cho từng ngày
    const colorScale = d3.scaleOrdinal()
        .domain([...Array(31).keys()].map(d => d + 1))
        .range(d3.schemeTableau10);

    // Thang đo trục X (Ngày trong tháng)
    const x = d3.scaleBand()
        .domain([...Array(31).keys()].map(d => d + 1)) // Đảm bảo có đủ 31 ngày
        .range([0, width])
        .padding(0.2);

    // Thang đo trục Y (Doanh số trung bình)
    const y = d3.scaleLinear()
        .domain([0, d3.max(doanhSoData, d => d.DoanhThuTrungBinh)])
        .range([height, 0]);

    // Vẽ thanh bar
    svg.selectAll(".bar")
        .data(doanhSoData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.NgayofThang))
        .attr("y", d => y(d.DoanhThuTrungBinh))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.DoanhThuTrungBinh))
        .attr("fill", d => colorScale(d.NgayofThang))
        .on("mouseover", (event, d) => {
            tooltip.style("visibility", "visible")
                   .html(`
                        <b>Ngày:</b> ${d.NgayofThang}<br>
                        <b>Doanh thu trung bình:</b> ${d3.format(",")(d.DoanhThuTrungBinh)} VNĐ <br>
                        <b>Số lượng bán trung bình:</b> ${d3.format(",")(d.SLTrungBinh)}
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
        .attr("x", d => x(d.NgayofThang) + x.bandwidth() / 2)
        .attr("y", d => y(d.DoanhThuTrungBinh) - 5)
        .attr("text-anchor", "middle")
        .style("fill", "#000")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .text(d => d3.format(",.0f")(d.DoanhThuTrungBinh / 1000000) + " tr");

    // Trục X (Ngày trong tháng)
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickValues([...Array(31).keys()].map(d => d + 1)));

    // Trục Y (Doanh số trung bình)
    svg.append("g")
        .call(d3.axisLeft(y).ticks(6).tickFormat(d => d3.format(".2s")(d)));

    // Thêm tiêu đề biểu đồ
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
});
