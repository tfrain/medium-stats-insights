'use strict';

/** Stories Page */

const stories_format_btn_wrap = document.querySelector('.stories_format_btn_wrap');
stories_format_btn_wrap.addEventListener('click', function (e) {
    if (e.target.classList.contains('format_btn-select')) return;

    for (let child of this.children) {
        if (child !== e.target) {
            child.classList.remove('format_btn-select');
        } else {
            child.classList.add('format_btn-select');
        }
    }
    renderStoriesHandler(e.target.dataset.storiesformat);
});

const renderStoriesHandler = (format) => {
    let stories;
    if (format === 'r/v') {
        stories = storiesData.map((story) => {
            if (story.totalStats.views == 0) {
                return
            }
            return {
                title: story.title,
                [format]: story.totalStats.reads / story.totalStats.views,
            };
        });
    } else if (format === 'earnings') {
        stories = storiesData.map((story) => {
            return {
                title: story.title,
                [format]: story.earnings.total.units + story.earnings.total.nanos / 1e9,
            };
        });
    } else {
        stories = storiesData.map((story) => {
            return {
                title: story.title,
                [format]: story.totalStats[format],
            };
        });
    }
    stories.sort((a, b) => (a[format] > b[format] ? -1 : a[format] == b[format] ? 0 : 1));

    const labels = stories.slice(0, 5).map(({ title }) => title);
    const data = stories.slice(0, 5).map((story) => story[format]);

    renderStoriesChart(labels, data, format);
};

const storiesCtx = document.getElementById('storiesChart').getContext('2d');
let storiesChart;

function renderStoriesChart(labels, data, format) {
    document.getElementById('storiesChart').style.display = 'block';
    // document.querySelector('#stories_loader').style.display = 'none';
    document.querySelector('#stories-progress-bar').style.display = 'none';
    if (storiesChart) {
        storiesChart.data.datasets[0].data = data;
        storiesChart.data.datasets[0].label = format;
        storiesChart.data.labels = labels;
        storiesChart.options.title.text = '';
        storiesChart.update();
        return;
    }
    storiesChart = new Chart(storiesCtx, {
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

const stories_download = document.querySelector('.stories_download');
const stories_download_loader = document.querySelector('.stories_download_loader');
const stories_download_wrap = document.querySelector('.stories_download_wrap');

function handleStoriesDownload() {
    exportstoriesToCsv();
    stories_download.style.display = 'block';
    stories_download_loader.stle.display = 'none';
}

function exportstoriesToCsv() {
    let csvArray = [['Title', 'Views', 'Reads', 'R/V', 'Claps', 'Fans', 'C/F', 'Date']];
    storiesData.forEach(({ title, views, reads, claps, upvotes, createdAt }) => {
        csvArray.push([
            title,
            views,
            reads,
            views > 0 ? (reads / views).toFixed(2) : 0,
            claps,
            upvotes,
            upvotes > 0 ? (claps / upvotes).toFixed(2) : 0,
            getDetailedDateLabelFromEpoch(new Date(createdAt)),
        ]);
    });

    const csvString = getCsvString(csvArray);
    stories_download_wrap.setAttribute(
        'href',
        'data:text/csv;charset=utf-8,' + encodeURIComponent(csvString)
    );
    stories_download_wrap.setAttribute(
        'download',
        `Medium-Stats-Counter-Stories${getDateKeyFromEpoch(NOW.epoch)}.csv`
    );
    stories_download_wrap.addEventListener('click', () => {
    });
}
