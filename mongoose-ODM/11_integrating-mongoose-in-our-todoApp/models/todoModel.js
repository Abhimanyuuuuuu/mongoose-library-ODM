import { model, Schema } from "mongoose";

const todoSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    strict: "throw",
  }
);

// export default model("Todo", todoSchema);

const Todo = model("Todo", todoSchema);
export default Todo;
