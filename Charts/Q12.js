const margin = { top: 30, right: 50, bottom: 60, left: 80 },
      width = 1400 - margin.left - margin.right,
      height = 800 - margin.top - margin.bottom;

const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Thêm tooltip
const tooltip = d3.select("#chart")
    .append("div")
    .style("position", "absolute")
    .style("background", "white")
    .style("border", "1px solid #ddd")
    .style("border-radius", "5px")
    .style("padding", "8px")
    .style("box-shadow", "0px 2px 6px rgba(0,0,0,0.2)")
    .style("visibility", "hidden")
    .style("pointer-events", "none")
    .style("font-size", "14px");

d3.csv("data.csv").then(data => {
    let customerSpending = new Map();

    // Tính tổng "Thành tiền" theo "Mã khách hàng"
    data.forEach(d => {
        let customerID = d["Mã khách hàng"];
        let amount = +d["Thành tiền"];

        if (!customerSpending.has(customerID)) {
            customerSpending.set(customerID, 0);
        }
        customerSpending.set(customerID, customerSpending.get(customerID) + amount);
    });

    // Xác định mức chi tiêu cao nhất và chia bin theo bước 50K
    let maxAmount = d3.max(Array.from(customerSpending.values()));
    let bins = d3.range(50000, maxAmount + 50000, 50000);

    let binCounts = new Map();
    bins.forEach(b => binCounts.set(b, 0));

    customerSpending.forEach(amount => {
        let bin = bins.find(b => amount <= b) || bins[bins.length - 1];
        binCounts.set(bin, binCounts.get(bin) + 1);
    });

    let chartData = Array.from(binCounts, ([bin, count]) => ({
        bin: bin,
        count: count
    }));

    const x = d3.scaleBand()
        .domain(chartData.map(d => d.bin))
        .range([0, width])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(chartData, d => d.count)])
        .range([height, 0]);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d => (d / 1000) + "K"))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    svg.append("g")
        .call(d3.axisLeft(y));

    // Vẽ cột với tooltip
    svg.selectAll(".bar")
        .data(chartData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.bin))
        .attr("y", d => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.count))
        .attr("fill", "steelblue")
        .on("mouseover", (event, d) => {
            tooltip.style("visibility", "visible")
                .html(`<strong>${(d.bin / 1000)}K</strong><br>Số lượng KH: ${d.count.toLocaleString()}`);
        })
        .on("mousemove", (event) => {
            tooltip.style("top", (event.pageY - 40) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", () => {
            tooltip.style("visibility", "hidden");
        });

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 50)
        .attr("text-anchor", "middle")
        .text("Mức chi tiêu (VNĐ)");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -50)
        .attr("text-anchor", "middle")
        .text("Số Khách Hàng");
});
