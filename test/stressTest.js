var request = require("request");

var options = {
    url: "http://localhost:2510/api/v1/render_jobs",
    form: {
        lang: "en",
        title: "Doulion: Counting Triangles in Massive Graphs with a Coin",
        lecture_id: 9182,
        video_id: 9340,
        text: "Counting the number of triangles in a graph is a beautiful algorithmic problem which has gained importance over the last years due to its significant role in complex network analysis. Metrics frequently computed such as the clustering coefficient and the transitivity ratio involve the execution of a triangle counting algorithm. Furthermore, several interesting graph mining applications rely on computing the number of triangles in the graph of interest. In this paper, we focus on the problem of counting triangles in a graph. We propose a practical method, out of which all triangle counting algorithms can potentially benefit. Using a straight-forward triangle counting algorithm as a black box, we performed 166 experiments on real-world networks and on synthetic datasets as well, where we show that our method works with high accuracy, typically more than 99\% and gives significant speedups, resulting in even $\approx$ 130 times faster performance.",
        categories: "computer science>data mining>graph mining",
        lecture_slug: "kdd09_tsourakakis_dctmgwc"
    }
};

request.post(options, function (error, respnse, body) {
    console.log(body);
});
