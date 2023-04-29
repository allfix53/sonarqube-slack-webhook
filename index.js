const express = require("express");
const axios = require("axios");
const moment = require("moment");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

function blocksFormatter(unformattedData) {
  const blocks = [];

  // header section
  blocks.push({
    type: "header",
    text: {
      type: "plain_text",
      text: `${
        unformattedData.qualityGate.status == "OK"
          ? `✅ [${unformattedData.qualityGate.status}]`
          : `⛔ [${unformattedData.qualityGate.status}]`
      } ${unformattedData.project.name}`,
      emoji: true,
    },
  });

  // task detail section
  blocks.push(
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Commit Rev:*\n\`${unformattedData.revision}\``,
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Task Id:*\n\`${unformattedData.taskId}\``,
        },
        {
          type: "mrkdwn",
          text: `*Analysed at:*\n\`${moment(unformattedData.analysedAt).format(
            "DD MMM, YYYY HH:mm:ss"
          )}\``,
        },
      ],
    }
  );

  // quality gate conditions
  let qualityGateCondition = `Quality Gate Conditions *${unformattedData.qualityGate.name}*`;
  unformattedData.qualityGate.conditions.map((condition, key) => {
    if (condition.status == "ERROR") {
      qualityGateCondition += `\n\`❌\` _*${condition.metric}\t: ${condition.status}*_`;
      qualityGateCondition += `\n>\`\`\`value \t\t : ${condition.value}`;
      qualityGateCondition += `\noperator  \t : ${condition.operator}`;
      qualityGateCondition += `\nerrorThreshold : ${condition.errorThreshold}\`\`\``;
    } else {
      qualityGateCondition += `\n\`✅\` ${condition.metric} : *${condition.status}*`;
    }
  });
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: qualityGateCondition,
    },
  });

  // devider
  blocks.push({
    type: "divider",
  });

  // action / button
  blocks.push(
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "_* You must have a *private network* to access sonarqube dashboard._",
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Go to sonarqube dashboard ➡️",
            emoji: true,
          },
          value: "got_to_sonarqube_dashboard",
          url: unformattedData.project.url,
          action_id: "actionId-0",
        },
      ],
    }
  );

  return blocks;
}

app.get("/", (req, res) => {
  res.send("Sonarqube slack webhook");
});

app.post("/", (req, res) => {
  const slackJsonFormat = { blocks: blocksFormatter(req.body) };
  axios.post(process.env.SLACK_WEBHOOK_URL, slackJsonFormat);
  res.json(slackJsonFormat);
});

app.listen(3000, () =>
  console.log("Sonarqube slack webhook is listening on port 3000.")
);
