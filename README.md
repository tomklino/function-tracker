# function-tracker
Tracks the value returned by a function across multiple calls so events can be attached to changes

function-tracker tracks functions that return an array or a Promise that resolves to an array, and fires events such as:

* `element_join` when an element that did not exist in the previous return value appears in the current one
* `element_left` when an element that existed in the previous return value does not appear in the current one

# Installation

```js
npm i --save function tracker
```

# Example usage

```js
const trackerFactory = require('function-tracker')

let usersTracker = trackerFactory({
  watchFunction: () => {
    //some function the fetches something and returns an array (or a Promise that resolves to an array)
  }
})
.on('element_join', (new_users) => { console.log("there are new users:", new_users) })
.on('element_left', (departed_users) => { console.log("these people are no longer with us:", departed_users) })

usersTracker.call() //returns [{username: "tom"}, {username: "ben"}]
//and after a while...
usersTracker.call() //returns [{username: "tom"}, {username: "maya"}]

//event element_join will be called with [{username: "maya}]
//event element_left will be called with [{username: "ben"}]
```

# Advanced usage

Let's assume we have a function `getActiveUsers` that returns the following format:

```json
[{username: "tom", active_since: 15234523711}, {username: "ben", active_since:  15234522612}]
```

Obviously the next time we call that function, all of the elements will be different becuase of the `active_since` field, even though the users tom and ben had not left or joined.

We can set the way `function-tracker` compares item from the last call to the current one like so:

```js
let usersTracker = trackerFactory({
  watchFunction: getActiveUsers
})
.setComparator((a,b) => { return a.username === b.username })
.on('element_join', (new_users) => { console.log("someone really joined!", new_users })
```
