const kDepths = [{value: 15, col: "#0277d5"}, {value: 25, col: "#e52418"}, {value: 40, col: "#49a801"}];
const kDepthPlaceholder = "$DEPTH";
const kUrl = `https://api.npolar.no/indicator/timeseries/?facets=label.en&q=&filter-systems=mosj.no&filter-authors.@id=met.no&filter-keywords.@value=land&filter-locations.placename=Janssonhaugen&filter-label.en=${kDepthPlaceholder}+m&format=json&variant=array&limit=1`;
const kWhitelistedLabels = ["2000", "2005", "2010", "2015", "2020"];

function renderChart(datasets, options = {
	yAxisTitle
}) {
	const context = document.getElementById("canvas-element").getContext("2d");

	const chart = new Chart(context, {
		type: "line",
		data: {
			datasets
		},
		options: {
			tension: 1,
			borderWidth: 4,
			animation: false,
			maintainAspectRatio: false,
			pointRadius: 0, // disable drawing of points for performance
			parsing: {
				xAxisKey: "when",
				yAxisKey: "value"
			},
			scales: {
				y: {
					title: {
						display: !!options.yAxisTitle,
						text: options.yAxisTitle
					}
				},
				x: {
					afterTickToLabelConversion: (data) => {
						// show only whitelisted labels
						for (let i = 0; i < data.ticks.length; ++i) {
							if (!kWhitelistedLabels.includes(data.ticks[i].label)) {
								data.ticks[i].label = "";
							}
						}
					},
					type: "timeseries",
					time: {
						unit: "year",
					}
				}
			}
		}
	});

	return chart;
}

async function fetchData(depth) {
	const depthValue = Number(depth.value);

	if (isNaN(depthValue)) {
		throw new Error(`depth is not a number: ${depthValue}`);
	}

	const response = await fetch(kUrl.replace(kDepthPlaceholder, depthValue), {
		method: "GET",
		headers: {
			"Content-Type": "application/json"
		}
	});

	if (!response.ok) {
		console.error(response);
		throw new Error(`http err: ${response.status}`);
	}

	const responseJson = await response.json();

	return {
		json: responseJson[0],
		depth: depth
	};
}

// main
(async () => {
	const promises = [];

	for (const depth of kDepths) {
		promises.push(fetchData(depth));
	}

	const data = await Promise.all(promises);
	const datasets = [];

	for (const d of data) {
		datasets.push({
			label: d.json.label.en,
			data: d.json.data,
			backgroundColor: "transparent",
			borderColor: d.depth.col,
		});
	}

	renderChart(datasets, {yAxisTitle: `${data[0].json.labels[0].label} ${data[0].json.unit.symbol}`});

	document.getElementById("loading-overlay").remove();
})();