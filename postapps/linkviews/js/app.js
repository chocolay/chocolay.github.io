<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>{% if page.title %}{{ page.title }}{% else %}{{ site.data.settings.title }}{% endif %}</title>
    <meta name='description' content='{% if page.description %}{{ page.description | strip_html | strip_newlines | truncate: 160 }}{% else %}{{ site.data.settings.description }}{% endif %}'>

    <link rel="canonical" href="{{ page.url | replace:'index.html','' | absolute_url }}">
    <link rel="alternate" type="application/rss+xml" title="{{ site.title | escape }}" href="{{ "/feed.xml" | relative_url }}">

    <!-- Fonts -->
    <link href="https://fonts.googleapis.com/css?family=Roboto:400,700" rel="stylesheet">
    <!-- Ionicons -->
    <link href="https://unpkg.com/ionicons@4.2.2/dist/css/ionicons.min.css" rel="stylesheet">

    <style>
        {% capture include_to_scssify %}
        {% include main.scss %}
        {% endcapture %}
        {{ include_to_scssify | scssify }}



        input.slider[type="range"] {
            -webkit-appearance: none;
            width: 50%;
            height: 25px;
            background: #d3d3d3;
            outline: none;
            opacity: 0.7;
            -webkit-transition: .2s;
            transition: opacity .2s;
        }

        input.slider:hover {
            opacity: 1;
        }

        input.slider[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 25px;
            height: 25px;
            background: #f6b141;
            cursor: pointer;
        }

        input.slider[type="range"]::-moz-range-thumb {
            width: 25px;
            height: 25px;
            background: #f6b141;
            cursor: pointer;
        }


{% if page.app=="linkviews" %}

        body {
            overflow: auto;
            margin: 0;
            font-size: 9px;
            text-align:center;
            font-weight: 300;
            font-family: "Helvetica Neue", Helvetica;}


        #bpg {
            margin:auto;
        }
        #mainDiv {
            cursor:pointer;
        }

        h1 {
            text-align:left;
            padding:20px;
        }
        #headerLeft {
            text-align:left;
            position:absolute;
            top:60px;
            left:10px;
            margin-right:0px;
            border: solid 1px black;
            border-radius:20px;
        }

        .hint {
            right: 0;
            width: 350px;
            color: #999;
            font-size:12px;
            padding:5px;
            margin:10px;
        }

        #mainDiv {
            position:relative;
            width:100%

        }

        #svgDiv {
            margin: auto;
        }

        div#toolTip {
            position: absolute;
            text-align: left;
            pointer-events: none;
            background: #FFFFEF;
            width: 250px;
            height: 125px;
            padding: 10px;
            border: 1px solid #D5D5D5;
            font-family: arial,helvetica,sans-serif;
            position: absolute;
            font-size: 1.1em;
            color: #333;
            padding: 10px;
            border-radius: 5px;
            background: rgba(255,255,255,0.9);
            color: #000;
            box-shadow: 0 1px 5px rgba(0,0,0,0.4);
            -moz-box-shadow: 0 1px 5px rgba(0,0,0,0.4);
            border:1px solid rgba(200,200,200,0.85);
            opacity:0;
        }

        div.tooltipTail {
            position: absolute;
            left:-7px;
            top: 72px;
            width: 7px;
            height: 13px;
            background: url("images/tail_white.png") 50% 0%;
        }

        div.toolTipBody {
            position:absolute;
            height:100px;
            width:230px;
        }

        div.header {
            text-transform: uppercase;
            text-align: left;
            font-size: 14px;
            margin-bottom: 2px;
            color:#666;
            text-align:center;

        }

        div.header-rule{
            height:1px;
            margin:1px auto 3px;
            margin-top:7px;
            margin-bottom:7px;
            background:#ddd;
            width:125px;
        }

        div.header1{
            /* text-transform: uppercase; */
            text-align: left;
            font-size: 13px;
            margin-bottom: 2px;
            color:#000;
            text-align:center;
        }

        div.header2{
            color:#000;
            text-transform:uppercase;
            font-size: 12px;
            margin-bottom: 2px;
            text-align:center;
        }

        div.header3 {
            color:#333;
            text-align: left;
            font-size: 15px;
            font-style: italic;
            font-family: Georgia;
            /*  width:170px;*/
            text-align:center;
        }



        #bpg-chartFrame{
            -webkit-transition: height ease-in-out 1s;
            -moz-transition: height ease-in-out 1s;
            -o-transition: height ease-in-out 1s;
            -ms-transition: height ease-in-out 1s;
        }

        #bpg-chart {
            position: relative;
            width: 100%;
            height: 100%;
        }


        div.selected {
            color: #000;
            background: #e9e9e9;
            border-color: #AAA;
            box-shadow: inset 0px 0px 4px rgba(0,0,0,0.2);
            padding-bottom:10px;
        }

        .link {
            fill: none;
            stroke: #ccc;
            stroke-width: 1.5px;
            stroke-linecap: round;
            stroke-opacity:.07;
            fill-opacity:0.1;
        }

        .colorA {
            fill: #ffae8a;
            stroke: #ffa751;
        }

        .colorB {
            fill: #e77d99;
            stroke: #e74974;
        }

        .colorC {
            fill:#ffcf8a;
            stroke:#ffb751;
        }

        .colorD {
            fill: #5dac8e;
            stroke: #0fcc85;
        }

        .colorE {
            fill: #849870;
            stroke: #849870;
        }

{% endif %}
    </style>
</head>
