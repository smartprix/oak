# oak
A simple logger that writes to json file, console, or any other custom transport.

### Install

  yarn add @smpx/oak
  
### Use

```js
// You can also use default import
import {Oak} from '@smpx/oak';

Oak.log('This is a simple message');

// The first argument is special, if it is a plain object it will be parsed and
// properties will be displayed seperate from the message.
// Some special properties are duration, label, level, error (an object itself), duration, createdAt
Oak.info({label: 'Apply a label'}, 'You can', 'Chain', 'Like in console', 0, 'Other types than string too');
```


#### Timers

```js
// Function to time
async function fnToTime() {
	return new Promise(resolve => setTimeout(resolve, 3000));
}

Oak.time('Unique message');

Oak.timeEnd('Unique message', 'Extra info', 'just like in Oak.log');

// Alternative timers

const key = Oak.time();

Oak.timeEnd(key, 'Extra info', 'just like in Oak.log');

// Time functions (Returns a promise)

// The last argument needs to be the function to time
Oak.logTimeTaken(fnToTime);

Oak.logTimeTaken({label: 'Timer'}, 'Just like', 'Oak.log', fnToTime);
```

#### Create Instances

```js
import {Oak} from '@smpx/oak';

const oak = new Oak('instanceLabel');

// This instance will have the label set to 'instanceLabel' automatically.
oak.log('Test');


const oak2 = new Oak({label: 'new', info: 'This is instance oak2'});

oak2.warn('Extra info will be attached');
```

#### Error parsing

```js
import {Oak} from '@smpx/oak';

Oak.error('Message for understanding context', new Error('Error Message'));
```

### Install Exception Handlers and Process Exit Handlers

```js
import {Oak} from '@smpx/oak';

Oak.installExceptionHandlers();
Oak.installExitHandlers();

```

