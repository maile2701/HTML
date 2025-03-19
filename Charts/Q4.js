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

    // Tính tổng doanh số theo Ngày trong tuần
    let doanhSoTheoNgayTrongTuan = d3.rollup(
        data,
        v => ({
            doanhSo: d3.sum(v, d => d["Thành tiền"]) / 52, // Chia cho 52 tuần
            soLuong: d3.sum(v, d => d["SL"])
        }),
        d => d["Thời gian tạo đơn"].getDay() // 0: Chủ Nhật, 1: Thứ Hai, ..., 6: Thứ Bảy
    );

    // Danh sách các ngày trong tuần theo đúng thứ tự
    const thuTuNgay = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

    let doanhSoData = Array.from(doanhSoTheoNgayTrongTuan, ([key, value]) => ({
        Ngay: key,
        DoanhThuTrungBinh: value.doanhSo,
        SLTrungBinh: value.soLuong
    })).sort((a, b) => a.Ngay - b.Ngay); // Sắp xếp theo thứ tự trong tuần

    // Thang đo màu sắc cho từng tháng
    const colorScale = d3.scaleOrdinal()
        .domain(doanhSoData.map(d => d.Ngay))
        .range(d3.schemeTableau10); // Bộ màu Tableau10 của D3.js

    // Thang đo trục X (Ngày trong tuần)
    const x = d3.scaleBand()
        .domain(thuTuNgay)
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
        .attr("x", d => x(thuTuNgay[d.Ngay]))
        .attr("y", d => y(d.DoanhThuTrungBinh))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.DoanhThuTrungBinh))
        .attr("fill", d => colorScale(d.Ngay))
        .on("mouseover", (event, d) => {
            tooltip.style("visibility", "visible")
                   .html(`
                        <b>Ngày:</b> ${thuTuNgay[d.Ngay]}<br>
                        <b>Doanh thu trung bình:</b> ${d3.format(",")(d.DoanhThuTrungBinh)} VNĐ <br>
                        <b>Số lượng bán trung bình:</b> ${thuTuNgay[d.Ngay]}
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
        .attr("x", d => x(thuTuNgay[d.Ngay]) + x.bandwidth() / 2)
        .attr("y", d => y(d.DoanhThuTrungBinh) - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "#000")
        .style("font-weight", "bold")
        .text(d => `${d3.format(",.0f")(d.DoanhThuTrungBinh)} VNĐ`);

    // Trục X (Ngày trong tuần)
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("text-anchor", "middle");

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
