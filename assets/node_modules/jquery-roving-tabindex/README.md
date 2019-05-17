# jquery-roving-tabindex

<p>
    <a href="https://travis-ci.org/makeup-jquery/jquery-roving-tabindex"><img src="https://api.travis-ci.org/makeup-jquery/jquery-roving-tabindex.svg?branch=master" alt="Build Status" /></a>
    <a href='https://coveralls.io/github/makeup-jquery/jquery-roving-tabindex?branch=master'><img src='https://coveralls.io/repos/makeup-jquery/jquery-roving-tabindex/badge.svg?branch=master&service=github' alt='Coverage Status' /></a>
    <a href="https://david-dm.org/makeup-jquery/jquery-roving-tabindex"><img src="https://david-dm.org/makeup-jquery/jquery-roving-tabindex.svg" alt="Dependency status" /></a>
    <a href="https://david-dm.org/makeup-jquery/jquery-roving-tabindex#info=devDependencies"><img src="https://david-dm.org/makeup-jquery/jquery-roving-tabindex/dev-status.svg" alt="devDependency status" /></a>
</p>

jQuery collection plugin that implements one or two dimensional roving keyboard tabindex on the items of a widget.


```js
$(widgetSelector).rovingTabindex(rovingItemsSelector, [options]);
```

## Install

```js
npm install jquery-roving-tabindex
```

## Example - One Dimensional

HTML:

```html
<ul role="tablist">
    <li role="tab">Tab 1</li>
    <li role="tab">Tab 2</li>
    <li role="tab">Tab 3</li>
</ul>
```

Execute plugin:

```js
$('[role=tablist]').rovingTabindex('[role=tab]');
```

Output:

```html
<ul role="tablist">
    <li role="tab" tabindex="0">Tab 0</li>
    <li role="tab">Tab 1</li>
    <li role="tab">Tab 2</li>
</ul>
```

First down arrow key will update DOM to:

```html
<ul role="tablist">
    <li role="tab">Tab 0</li>
    <li role="tab" tabindex="0">Tab 1</li>
    <li role="tab">Tab 2</li>
</ul>
```

Next down arrow key will update DOM to:

```html
<ul role="tablist">
    <li role="tab">Tab 0</li>
    <li role="tab" tabindex="-1">Tab 1</li>
    <li role="tab">Tab 2</li>
</ul>
```

To listen for roving tabindex changes:

```js
$('.widget').on('rovingTabindexChange', 'li', function(e, data) {
    // this = new roving tab li element
    // data = {fromIndex: n, toIndex: n}
});
```

## Example - Two Dimensional

HTML:

```html
<div class="widget">
    <table>
        <tbody>
            <tr><td>1</td><td>2</td><td>3</td></tr>
            <tr><td>4</td><td>5</td><td>6</td></tr>
            <tr><td>7</td><td>8</td><td>9</td></tr>
        </tbody>
    </table>
</div>
```

Execute plugin:

```js
$('.widget').rovingTabindex('td', {isGrid: true});
```

## Params

* `rovingItemsSelector`: selector that identifies the descendant collection that requires a roving tab index
* `options.activeIndex`: index of the item that receives tabindex on init (default: 0)
* `options.autoFocus`: set focus when roving tabindex changes (default: true)
* `options.autoInit`: set initial tabindex state (but not focus) when plugin executes (default: true)
* `options.autoReset`: reset tabindex state when focus exits widget (default: false)
* `options.autoWrap`: reaching end of collection will wrap back to beginning, and vice versa (default: false)
* `options.axis`: x, y or both (default: 'both')
* `options.disableHomeAndEndKeys`: disable HOME and END key functionality (default: false)
* `options.isGrid`: specify two-dimensional navigation (default: false)

## Triggers

* `rovingTabindexChange` : fired when collection's roving tabindex changes

## Listens

* `domChange` : trigger on widget when underlying dom changes. For example, new roving items are added.

## Dependencies

* [jquery](https://jquery.com/)
* [jquery-linear-navigation](https://github.com/makeup-jquery/jquery-linear-navigation)
* [jquery-grid-navigation](https://github.com/makeup-jquery/jquery-grid-navigation)
* [jquery-prevent-scroll-keys](https://github.com/makeup-jquery/jquery-prevent-scroll-keys)

## Development

Useful NPM task runners:

* `npm start` for local browser-sync development.
* `npm test` runs tests & generates reports (see reports section below)
* `npm run tdd` test driven development: watches code and re-tests after any change
* `npm run build` cleans, lints, tests and minifies

Execute `npm run` to view all available CLI scripts.

## CI Build

https://travis-ci.org/makeup-jquery/jquery-roving-tabindex

## Code Coverage

https://coveralls.io/github/makeup-jquery/jquery-roving-tabindex?branch=master

## Test Reports

Local test reports are generated under `test_reports` folder.

## JSDocs

Local JSDocs are generated under `jsdoc` folder.
