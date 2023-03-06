import { SSTConfig } from "sst";
import { API } from "./stacks/MyStack";

export default {
  config(_input) {
    return {
      name: "dashboard-backend",
      region: "us-east-1",
    };
  },
  stacks(app) {    app.stack(API)
},
} satisfies SSTConfig;