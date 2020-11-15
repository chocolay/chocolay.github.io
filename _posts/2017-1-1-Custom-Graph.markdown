---
layout: post
title:  Connecting the Dots
date:   2017-01-1 15:01:35 +0300
image:  homemadeGraph.png
tags:   tool graph network table bespoke connections no-data illustration
d3version: https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.17/d3.min.js
app:    homemadeGraph
style:  homemadeGraph
---

This tool was built for a client whose business revolved around AI-classification of "big data" where the goal is to assign "things" to categories. 

They wanted to illustrate how the categories themselves were related to each other &mdash because of similarities within them. 
For instances, canoes and kayaks are "closer together" than either one is to sailboats.
    

To use:
- Click in the open area to create a circle that represents a cluster of data. The default is that the colors are determined by the position where you clicked.  To start with, it is assumed that all members within a single group are 100% alike (with actual data, this might be a correlation)

- Double-clicking on a group allows you to edit its name, color, and the "similarity" number 

- The closer together the circles, the more similar the groups are. Groups closer than a threshold (which you can adjust) are connected by a line.
             
- Repositioning a circle changes the correlation between its group and its neighbors. In the fullter version, you can edit this number in the table, in which case it becomes fixed.

While this only presents data in a 2-dimensional space &mdash; and data relationships are typically much more complicated &mdash; the client wanted to rapdily assemble networks manually for illustrative purposes. The full tool has been used in presentations to investors to illustrate goals in an AI-based business.

And, ultimately, was used programmatically with the results of their classification models.
    
    
