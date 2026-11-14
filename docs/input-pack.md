# Color, phone and rating inputs

These controls add common form values without changing the existing Field,
choice or data-source contracts. Original code uses MIT; PhoneInput also imports
the separately attributed libphonenumber-js metadata library. The host owns
submission, access checks and durable storage.

## ColorPicker

`ColorPicker` accepts `value`/`defaultValue` as a supported CSS color string or
null. Users can edit HEX, RGB or HSL, choose a native color or select a swatch.
The text editor preserves invalid drafts. Valid typing updates the canonical value
without replacing the active text; Enter or blur normalizes its presentation;
Escape restores the committed value. The format choice changes presentation.
Invalid drafts must be corrected or restored before changing format.

`onValueChange` and the named hidden form value use uppercase HEX: `#RRGGBB`, or
`#RRGGBBAA` when alpha is below one. `alpha={false}` drops transparency. The
opacity range uses native keyboard steps. Supported parsing includes three-,
four-, six- and eight-digit HEX, numeric/percentage RGB and HSL; named colors,
CSS variables and browser-dependent color spaces are excluded.

`parseColorValue`, `formatColorValue` and `colorChannels` are pure helpers. RGB
channels are finite 0–255 and alpha is 0–1. HEX alpha is quantized to eight bits.
Keep source color data if another color space needs greater precision.

## PhoneInput

`PhoneInput` uses full libphonenumber-js numbering metadata. The country search
uses localized region names and real calling codes. `countries` can restrict the
visible country set; `country`/`onCountryChange` control the selection, while
`defaultCountry` supplies its uncontrolled starting point. Country choices use
text rather than platform-dependent emoji flags.

National and international text stay editable. Valid changes produce E.164 values
such as `+61412345678`; formatting occurs on blur or external value updates so
ordinary typing does not continuously replace the caret position. Incomplete or
invalid text keeps the last committed value while native validity blocks submit.
Escape restores that committed number. Extensions and numbers embedded in prose
are rejected. Changing country revalidates the visible national number; it does
not silently convert a saved number into a new owner's number.

`parsePhoneValue` returns the canonical value and metadata-derived national and
international display forms. `getPhoneCountries` supplies country choices. The
metadata dependency must be maintained as numbering plans change. Validation
does **not** check whether a number is assigned, reachable or owned by a person;
the component sends no call or SMS and provides no authentication service.

## Rating

`Rating` uses native radio values. `max` is an integer from one to ten; `step` is
one or one half. The model is a supported score or null, with no rating submitted
when null. Arrow keys move one step, Home/End reach bounds, and horizontal keys
follow the scoped direction. Pointer half-star areas and keyboard values refer
to the same score. Hover previews never change the submitted value.

Read-only ratings remain inspectable and submit their score. Clear rating restores
null; a required, unrated group fails native validation. Ten-star summaries resize
within a narrow container. Use text alongside ratings when the score's meaning
needs explanation; a star count alone is not a business assessment.

## Native forms and ownership

All three controls accept `name`, external `form`, `required`, `disabled` and
`readOnly`. Disabled values are excluded; read-only values remain submitted.
Native reset restores uncontrolled defaults without reporting a user change,
and respects a cancelled reset. Controlled values remain host-owned, including
null. If a controlled host rejects a valid edit by retaining its value, the visible
field restores that accepted value. Invalid drafts reset even when the committed value never changed.

Color and phone inputs keep synchronous native validity. Blur error disclosure
waits until an outside pointer activation completes so it cannot move a Submit
button between press and release. Host-provided errors remain visible. Provide a
label, render meaningful error messages and validate accepted values on the
server as part of the application's own contract.

The complete examples demonstrate submission, prevented reset and controlled,
read-only and disabled fields. Metadata and pure parsing checks are separate from
browser, accessibility and physical-device review; no certification is implied.
