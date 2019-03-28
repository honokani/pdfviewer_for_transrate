const path = require('path')
const src_path  = path.join(__dirname, 'src')
const dist_path = path.join(__dirname, 'dist')

module.exports =
  { entry: path.join(src_path, 'index.js')
  , mode:  "development"
  , node: { fs: 'empty'
          }
  , module: 
    { rules: 
      [ { test:    /\.html$/
        , exclude: /node_modules/
        , loader:  'file-loader?name=[name].[ext]'
        }
      , { test:    /\.(css|scss)$/,
          use:     ['style-loader', 'css-loader']
        }
      , { test:    /\.(sass)$/,
          use:     ['style-loader', 'css-loader', 'sass-loader']
        }
      , { test:    /\.elm$/
        , exclude: [/elm-stuff/, /node_modules/]
        , loader:  ["elm-webpack-loader"]
        }
      , { test:    /\.(eot|gif|ico|jpg|jpeg|otf|png|svg|ttf|woff|woff2)$/
        , loader:  'url-loader?name=[name].[ext]'
        }
      ]
    }
  , output: 
    { path:     dist_path
    , filename: "elmapp.js"
    }
  , devServer:
    { host:   "0.0.0.0"
    , port:   3000
    , inline: true
    , stats:  { colors: true }
    }
  }

