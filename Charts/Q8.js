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
        d["SL"] = +d["SL"];
        d["Thời gian tạo đơn"] = new Date(d["Thời gian tạo đơn"]); // Chuyển đổi thành kiểu Date
        d["Tháng"] = d["Thời gian tạo đơn"].getMonth() + 1; // Lấy tháng từ 1-12
    });

    // Nhóm dữ liệu theo Tháng
    let thangMap = d3.group(data, d => d["Tháng"]);
    
    // Tính tổng số đơn hàng trong từng tháng
    let tongDonHangTheoThang = new Map();

    thangMap.forEach((donHang, thang) => {
        let donHangSet = new Set(donHang.map(d => d["Mã đơn hàng"]));
        tongDonHangTheoThang.set(thang, donHangSet.size);
    });

    // Đếm số đơn hàng có chứa mỗi nhóm hàng trong từng tháng
    let soDonHangTheoNhomHangThang = new Map();

    thangMap.forEach((donHang, thang) => {
        let nhomHangMap = new Map();

        donHang.forEach(d => {
            let maNhomHang = d["Mã nhóm hàng"];
            if (!nhomHangMap.has(maNhomHang)) {
                nhomHangMap.set(maNhomHang, new Set());
            }
            nhomHangMap.get(maNhomHang).add(d["Mã đơn hàng"]);
        });

        nhomHangMap.forEach((donSet, maNhomHang) => {
            if (!soDonHangTheoNhomHangThang.has(maNhomHang)) {
                soDonHangTheoNhomHangThang.set(maNhomHang, new Map());
            }
            soDonHangTheoNhomHangThang.get(maNhomHang).set(thang, donSet.size);
        });
    });

    // Tạo dữ liệu cho biểu đồ
    let xacSuatData = [];

    soDonHangTheoNhomHangThang.forEach((thangMap, maNhomHang) => {
        let tenNhomHang = data.find(d => d["Mã nhóm hàng"] === maNhomHang)["Tên nhóm hàng"];
        let lineData = [];

        thangMap.forEach((soDon, thang) => {
            let tongDonThang = tongDonHangTheoThang.get(thang);
            lineData.push({
                Thang: thang,
                XacSuat: soDon / tongDonThang, // Xác suất xuất hiện
                SoLuongDon: soDon,
                MaNhomHang: maNhomHang,
                TenNhomHang: tenNhomHang
            });
        });

        xacSuatData.push({
            MaNhomHang: maNhomHang,
            TenNhomHang: tenNhomHang,
            LineData: lineData
        });
    });

    // Sắp xếp tháng theo thứ tự
    const thangArray = Array.from(tongDonHangTheoThang.keys()).sort(d3.ascending);

    // Bảng màu cố định theo nhóm hàng
    const colorScale = d3.scaleOrdinal()
        .domain(xacSuatData.map(d => d.MaNhomHang))
        .range(d3.schemeTableau10);

    const x = d3.scalePoint()
        .domain(thangArray)
        .range([0, width - 100]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(xacSuatData, d => d3.max(d.LineData, v => v.XacSuat))])
        .range([height, 0]);

    // Vẽ đường cho từng nhóm hàng
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
        .style("stroke", d => colorScale(d.MaNhomHang))
        .style("stroke-width", 2);

    // Vẽ điểm trên đường
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
        .attr("r", 4)
        .style("fill", d => colorScale(d.MaNhomHang))
        .on("mouseover", (event, d) => {
            tooltip.style("visibility", "visible")
                   .html(`
                        <b>Tháng:</b> ${d.Thang}<br>
                        <b>Nhóm hàng:</b> [${d.MaNhomHang}] ${d.TenNhomHang}<br>
                        <b>SL Đơn Bán:</b> ${d.SoLuongDon.toLocaleString()}<br>
                        <b>Xác suất Bán:</b> ${(d.XacSuat * 100).toFixed(1)}%
                    `);
        })
        .on("mousemove", event => {
            tooltip.style("top", (event.pageY - 10) + "px")
                   .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", () => tooltip.style("visibility", "hidden"));

    // Trục X (Tháng)
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d => `Tháng ${d}`))
        .selectAll("text")
        .style("text-anchor", "middle");

    // Trục Y (Xác suất phần trăm)
    svg.append("g")
        .call(d3.axisLeft(y).ticks(6).tickFormat(d3.format(".0%")));

    // Chú thích (Legend)
    const legend = svg.append("g")
        .attr("transform", `translate(${width - 50}, 20)`);

    xacSuatData.forEach((d, i) => {
        const legendRow = legend.append("g")
            .attr("transform", `translate(0, ${i * 25})`);

        legendRow.append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", colorScale(d.MaNhomHang));

        legendRow.append("text")
            .attr("x", 20)
            .attr("y", 12)
            .style("text-anchor", "start")
            .style("font-size", "14px")
            .text(`[${d.MaNhomHang}] ${d.TenNhomHang}`);
    });

});
