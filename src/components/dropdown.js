import { dom } from 'isomorphic-jsx';

const Dropdown = ({children, label}) =>
	<label class="dropdown">
		<style>{`
			.dropdown {
				padding: 5px;
				border: 1px solid black;
				border-radius: 5px;
				display: inline-block;
				position: relative;
				background: white;
				min-width: 150px;
			}
			.dropdown span {
				-webkit-touch-callout: none; /* iOS Safari */
				  -webkit-user-select: none; /* Safari */
					-khtml-user-select: none; /* Konqueror HTML */
					  -moz-user-select: none; /* Firefox */
						-ms-user-select: none; /* Internet Explorer/Edge */
							 user-select: none; /* Non-prefixed version, currently supported by Chrome and Opera */
			}
			.dropdown input[type=checkbox] {
				display: none;
			}
			.dropdown section { display: none }
			.dropdown input[type=checkbox]:checked + section { display: block }
			.dropdown section {
				position: absolute;
				color: white;
				background: black;
				border: 1px solid black;
				border-radius: 5px;
				z-index: -10;
				left: 0;
				right: 0;
				padding-bottom: 15px;
			}
			section > * {
				padding: 15px 15px 0 15px;
			}
			section a {
				color: white;
			}
			.down.icon {
				color: #000;
				position: absolute;
				margin-left: 10px;
				margin-top: -0.2em;
				width: 1em;
				height: 1em;
				border-bottom: solid 1px currentColor;
				border-left: solid 1px currentColor;
				-webkit-transform: rotate(-45deg);
				transform: rotate(-45deg);
			}
		`}</style>
		<span>{ label||"Unnamed" }<span class="down icon" /></span>
		<input type="checkbox" />
		<section>
			{children}
		</section>
	</label>;

export default Dropdown;
