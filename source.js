'use strict';

/** Analysis Page */

const analysis_format_btn_wrap = document.querySelector('.analysis_format_btn_wrap');
analysis_format_btn_wrap.addEventListener('click', function (e) {
    if (e.target.classList.contains('format_btn-select')) return;

    for (let child of this.children) {
        if (child !== e.target) {
            child.classList.remove('format_btn-select');
        } else {
            child.classList.add('format_btn-select');
        }
    }
    renderAnalysisHandler(e.target.dataset.analysisformat);
});

// INTERNAL/DIRECT/PLATFORM/SEARCH/SITE
const renderAnalysisHandler = (format) => {
    let sources;
    sources = sourceTableData[format].map((entry) => {
        if (entry.totalCount == 0) {
            return
        }
        return {
            title: entry.sourceIdentifier,
            [format]: entry.totalCount,
        };
    });
    sources.sort((a, b) => (a[format] > b[format] ? -1 : a[format] == b[format] ? 0 : 1));

    const labels = sources.slice(0, 10).map(({ title }) => title);
    const data = sources.slice(0, 10).map((story) => story[format]);

    renderAnalysisChart(labels, data, format);
};

const analysisCtx = document.getElementById('analysisChart').getContext('2d');
let analysisChart;

function renderAnalysisChart(labels, data, format) {
    document.getElementById('analysisChart').style.display = 'block';
    // document.querySelector('#analysis_loader').style.display = 'none';
    document.querySelector('#progress-bar').style.display = 'none';
    if (analysisChart) {
        analysisChart.data.datasets[0].data = data;
        analysisChart.data.datasets[0].label = format;
        analysisChart.data.labels = labels;
        analysisChart.options.title.text = '';
        analysisChart.update();
        return;
    }
    analysisChart = new Chart(analysisCtx, {
        type: 'horizontalBar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: format,
                    borderColor: '#6e72b7',
                    backgroundColor: 'rgba(80, 141, 162, 0.9)',
                    data: data,
                },
            ],
        },

        options: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: '',
                position: 'bottom',
            },
            tooltips: {
                displayColors: false,
                callbacks: {
                    title: (tooltipItem, data) => data.labels[tooltipItem[0].index],
                    label: (tooltipItem, data) =>
                        `${data.datasets[0].label}: ${data.datasets[0].data[
                            tooltipItem.index
                        ].toLocaleString()}`,
                },
            },

            scales: {
                xAxes: [
                    {
                        ticks: {
                            beginAtZero: true,
                            callback: (t) => numFormater(t),
                        },
                    },
                ],
                yAxes: [
                    {
                        ticks: {
                            callback: (value) => trimString(value, 12),
                        },
                    },
                ],
            },
        },
    });
}

