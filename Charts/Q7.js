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
    });

    // Nhóm dữ liệu theo đơn hàng
    let donHangMap = d3.group(data, d => d["Mã đơn hàng"]);
    let tongDonHang = donHangMap.size; // Tổng số đơn hàng

    // Đếm số đơn hàng có chứa mỗi nhóm hàng
    let soDonHangTheoNhomHang = new Map();

    donHangMap.forEach(donHang => {
        let nhomHangSet = new Set(donHang.map(d => d["Mã nhóm hàng"])); // Lấy danh sách nhóm hàng có trong đơn hàng

        nhomHangSet.forEach(maNhomHang => {
            soDonHangTheoNhomHang.set(maNhomHang, (soDonHangTheoNhomHang.get(maNhomHang) || 0) + 1);
        });
    });

    // Tính xác suất xuất hiện của mỗi nhóm hàng (số đơn hàng có nhóm hàng đó / tổng đơn hàng)
    let xacSuatData = Array.from(soDonHangTheoNhomHang, ([maNhomHang, soDonHang]) => ({
        MaNhomHang: maNhomHang,
        XacSuat: soDonHang / tongDonHang, // Xác suất xuất hiện của nhóm hàng
        SoLuongDon: soDonHang, // Số lượng đơn có chứa nhóm hàng
        TenNhomHang: data.find(d => d["Mã nhóm hàng"] === maNhomHang)["Tên nhóm hàng"]
    }));

    // Sắp xếp giảm dần theo xác suất
    xacSuatData.sort((a, b) => b.XacSuat - a.XacSuat);

    // Bảng màu cố định theo nhóm hàng
    const colorScale = d3.scaleOrdinal()
        .domain(xacSuatData.map(d => d.MaNhomHang))
        .range(d3.schemeTableau10);

    const x = d3.scaleLinear()
        .domain([0, d3.max(xacSuatData, d => d.XacSuat)])  // Xác suất tối đa
        .range([0, width - 100]);

    const y = d3.scaleBand()
        .domain(xacSuatData.map(d => `[${d.MaNhomHang}] ${d.TenNhomHang}`))
        .range([0, height])
        .padding(0.2);

    // Vẽ các thanh bar
    svg.selectAll(".bar")
        .data(xacSuatData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("y", d => y(`[${d.MaNhomHang}] ${d.TenNhomHang}`))
        .attr("width", d => x(d.XacSuat))
        .attr("height", y.bandwidth())
        .attr("fill", d => colorScale(d.MaNhomHang)) // Màu sắc theo nhóm hàng
        .on("mouseover", (event, d) => {
            tooltip.style("visibility", "visible")
                   .html(`
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

    // Thêm nhãn xác suất trên mỗi thanh bar
    svg.selectAll(".label")
        .data(xacSuatData)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => x(d.XacSuat) + 10)
        .attr("y", d => y(`[${d.MaNhomHang}] ${d.TenNhomHang}`) + y.bandwidth() / 2)
        .attr("dy", ".35em")
        .text(d => (d.XacSuat * 100).toFixed(1) + "%");

    // Trục X (dạng phần trăm)
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(6).tickFormat(d3.format(".0%")))
        .selectAll("text")
        .style("text-anchor", "middle");

    // Trục Y
    svg.append("g")
        .call(d3.axisLeft(y));
});
