const width = 700;
const radius = width / 2;

const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width)
  .attr("height", width)
  .append("g")
  .attr("transform", `translate(${radius},${radius})`);

const tooltip = d3.select("#tooltip");

const color = d3.scaleOrdinal(d3.schemeCategory10);

d3.json("data/data.json").then(data => {

  const root = d3.hierarchy(data)
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value);

  const partition = d3.partition()
    .size([2 * Math.PI, radius]);

  partition(root);

  const arc = d3.arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .innerRadius(d => d.y0)
    .outerRadius(d => d.y1);

  const path = svg.selectAll("path")
    .data(root.descendants().filter(d => d.depth))
    .enter()
    .append("path")
    .attr("display", d => d.depth ? null : "none")
    .attr("d", arc)
    .attr("fill", d => color((d.children ? d : d.parent).data.name))
    .attr("stroke", "#fff")
    .style("cursor", "pointer")
    .on("mouseover", (event, d) => {
      tooltip
        .style("opacity", 1)
        .html(`
          <strong>${d.data.name}</strong><br>
          Applications: ${d.value}
        `);
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px");
    })
    .on("mouseout", () => {
      tooltip.style("opacity", 0);
    });

  // CLICK ZOOM ANIMATION
  path.on("click", (event, clicked) => {
    root.each(d => {
      d.target = {
        x0: Math.max(0, Math.min(1, (d.x0 - clicked.x0) / (clicked.x1 - clicked.x0))) * 2 * Math.PI,
        x1: Math.max(0, Math.min(1, (d.x1 - clicked.x0) / (clicked.x1 - clicked.x0))) * 2 * Math.PI,
        y0: Math.max(0, d.y0 - clicked.y0),
        y1: Math.max(0, d.y1 - clicked.y0)
      };
    });

    const transition = svg.transition().duration(750);

    path.transition(transition)
      .attrTween("d", d => {
        const interpolate = d3.interpolate(d.current || d, d.target);
        return t => arc(interpolate(t));
      })
      .on("end", d => d.current = d.target);
  });

});
