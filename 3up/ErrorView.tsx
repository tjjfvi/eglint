
import "./ErrorView.styl"
import React from "react"

export const ErrorView = ({ error }: { error: Error }) =>
  <div className="ErrorView">
    {error.stack?.replace(/ \(\S+/g, "")}
  </div>
