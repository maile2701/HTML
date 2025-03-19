const margin = { top: 30, right: 50, bottom: 40, left: 60 },
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
    let customerOrders = new Map();

    data.forEach(d => {
        let key = d["Mã khách hàng"] + "_" + d["Mã đơn hàng"];
        customerOrders.set(key, d["Mã khách hàng"]);
    });

    let orderCounts = d3.rollup([...customerOrders.values()], 
        v => v.length,
        d => d
    );

    let purchaseDistribution = d3.rollup([...orderCounts.values()], 
        v => v.length,
        d => d
    );

    let purchaseData = Array.from(purchaseDistribution, ([orderCount, customerCount]) => ({
        orderCount: +orderCount,
        customerCount: +customerCount
    })).sort((a, b) => d3.ascending(a.orderCount, b.orderCount));

    const x = d3.scaleBand()
        .domain(purchaseData.map(d => d.orderCount))
        .range([0, width])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(purchaseData, d => d.customerCount)])
        .range([height, 0]);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d => d));

    svg.append("g")
        .call(d3.axisLeft(y).ticks(6));

    // Vẽ cột với tooltip
    svg.selectAll(".bar")
        .data(purchaseData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.orderCount))
        .attr("y", d => y(d.customerCount))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.customerCount))
        .attr("fill", "steelblue")
        .on("mouseover", (event, d) => {
            tooltip.style("visibility", "visible")
                .html(`<strong>Đã mua ${d.orderCount} lần</strong><br>Số lượng KH: ${d.customerCount.toLocaleString()}`);
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
        .style("font-weight", "bold")

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 35)
        .attr("text-anchor", "middle")
        .text("Số lượt mua hàng");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -40)
        .attr("text-anchor", "middle")
        .text("Số khách hàng");
});
