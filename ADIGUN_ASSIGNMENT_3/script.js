d3.csv("Loan_approval_data_2025.csv").then(function (data) {
  // Convert numeric values
  data.forEach((d) => {
    d.annual_income = +d.annual_income;
    d.credit_score = +d.credit_score;
    d.loan_amount = +d.loan_amount;
    d.loan_status = +d.loan_status; // 0 or 1
  });

  // metrics i want
   const metrics = [
    { key: "credit_score", label: "Average Credit Score" },
    { key: "annual_income", label: "Average Annual Income" },
    { key: "loan_amount", label: "Average Loan Amount" },
  ];

  const statusNames = {
    0: "Rejected",
    1: "Approved",
  };

  // averages per loan_status
  const grouped = d3.rollups(
    data,
    (v) => ({
      credit_score: d3.mean(v, (d) => d.credit_score),
      annual_income: d3.mean(v, (d) => d.annual_income),
      loan_amount: d3.mean(v, (d) => d.loan_amount),
    }),
    (d) => d.loan_status
  );

 // Turn into array 
  const chartData = grouped.map(([status, vals]) => ({
    status: statusNames[status] ?? status,
    values: metrics.map((m) => ({
      metric: m.key,
      label: m.label,
      value: vals[m.key],
    })),
  }));

  const margin = { top: 60, right: 40, bottom: 60, left: 70 },
    width = 800 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  //  Scales
  const x0 = d3
    .scaleBand()
    .domain(chartData.map((d) => d.status))
    .range([0, width])
    .paddingInner(0.2);

  const x1 = d3
    .scaleBand()
    .domain(metrics.map((m) => m.key))
    .range([0, x0.bandwidth()])
    .padding(0.1);

  const y = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(chartData, (d) => d3.max(d.values, (v) => v.value)),
    ])
    .nice()
    .range([height, 0]);

  const color = d3
    .scaleOrdinal()
    .domain(metrics.map((m) => m.key))
    .range(["#1f77b4", "#ff7f0e", "#d62728"]);

  // Axes
  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x0));

  svg.append("g").call(d3.axisLeft(y));

  //  Title
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .style("font-size", "22px")
    .style("font-weight", "bold")
    .text("Credit Score, Income & Loan Amount by Loan Status");

  //  Tooltip
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip");

  //  Bars
  const statusGroups = svg
    .selectAll(".status-group")
    .data(chartData)
    .enter()
    .append("g")
    .attr("class", "status-group")
    .attr("transform", (d) => `translate(${x0(d.status)},0)`);

  statusGroups
    .selectAll("rect")
    .data((d) => d.values.map((v) => ({ status: d.status, ...v })))
    .enter()
    .append("rect")
    .attr("x", (d) => x1(d.metric))
    .attr("y", height)
    .attr("width", x1.bandwidth())
    .attr("height", 0)
    .attr("fill", (d) => color(d.metric))
    .on("mouseover", (event, d) => {
      tooltip
        .style("visibility", "visible")
        .html(
          `<strong>${d.status}</strong><br>${d.label}: ${d.value.toFixed(2)}`
        );
    })
    .on("mousemove", (event) => {
      tooltip
        .style("top", event.pageY - 20 + "px")
        .style("left", event.pageX + 20 + "px");
    })
    .on("mouseout", () => tooltip.style("visibility", "hidden"))
    .transition()
    .duration(1200)
    .attr("y", (d) => y(d.value))
    .attr("height", (d) => height - y(d.value));

  //  Legend
  const legend = svg
    .append("g")
    .attr("transform", `translate(${width - 200}, 0)`);

  const legendItem = legend
    .selectAll(".legend-item")
    .data(metrics)
    .enter()
    .append("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => `translate(0, ${i * 20})`);

  legendItem
    .append("rect")
    .attr("x", 0)
    .attr("y", -10)
    .attr("width", 12)
    .attr("height", 12)
    .attr("fill", (d) => color(d.key));

  legendItem
    .append("text")
    .attr("x", 20)
    .attr("y", 0)
    .attr("alignment-baseline", "middle")
    .text((d) => d.label);
});