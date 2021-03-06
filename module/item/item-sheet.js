import { PrepareMoveData, warn } from '../ptu.js';

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class PTUItemSheet extends ItemSheet {
	/** @override */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ['ptu', 'sheet', 'item'],
			width: 790,
			height: 193,
			tabs: [
				{
					navSelector: '.sheet-tabs',
					contentSelector: '.sheet-body',
					initial: 'description'
				}
			]
		});
	}

	/** @override */
	get template() {
		const path = 'systems/ptu/templates/item';
		// Return a single sheet for all item types.
		// return `${path}/item-sheet.html`;

		// Alternatively, you could use the following return statement to do a
		// unique item sheet by type, like `weapon-sheet.html`.
		return `${path}/item-${this.item.data.type}-sheet.html`;
	}

	/* -------------------------------------------- */

	/** @override */
	getData() {
		const data = super.getData();

		data.data = PrepareMoveData(this.object.options.actor?.data?.data, data.data);
		return data;
	}

	/* -------------------------------------------- */

	/** @override */
	setPosition(options = {}) {
		const position = super.setPosition(options);
		const sheetBody = this.element.find('.sheet-body');
		const bodyHeight = position.height - 192;
		sheetBody.css('height', bodyHeight);
		return position;
	}

	/* -------------------------------------------- */

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);

		// Everything below here is only needed if the sheet is editable
		if (!this.options.editable) return;

		// Rollable entries.
		html.find('.rollable').click(this._onRoll.bind(this));
	}

	/**
	 * Handle clickable rolls.
	 * @param {Event} event   The originating click event
	 * @private
	 */
	_onRoll(event) {
		event.preventDefault();

		const element = event.currentTarget;
		const dataset = element.dataset;

		if (dataset.roll || dataset.type == 'Status') {
			let roll = new Roll('1d20+' + dataset.ac, this.actor.data.data);
			let label = dataset.label ? `To-Hit for move: ${dataset.label} ` : '';
			roll.roll().toMessage({
				speaker: ChatMessage.getSpeaker({ actor: this.actor }),
				flavor: label
			});

			let diceResult = -2;
			try{
			    diceResult = roll.terms[0].results[0].result;
            }
            catch(err){
            	warn("Old system detected, using deprecated rolling...")
            	diceResult = roll.parts[0].results[0];
			}
			if (diceResult === 1) {
				CONFIG.ChatMessage.entityClass.create({
					content: `${dataset.label} critically missed!`,
					type: CONST.CHAT_MESSAGE_TYPES.OOC,
					speaker: ChatMessage.getSpeaker({ actor: this.actor }),
					user: game.user._id
				});
				return;
			}
      		let isCrit = diceResult >= 20 - dataset.critrange;

			if (dataset.type == 'Physical' || dataset.type == 'Special') {
				let rollData = dataset.roll.split('#');
				let roll = new Roll(isCrit ? '@roll+@roll+@mod' : '@roll+@mod', {
					roll: rollData[0],
					mod: rollData[1]
				});
				let label = dataset.label ? `${isCrit ? "Crit damage" : "Damage"} for move: ${dataset.label}` : '';
				roll.roll().toMessage({
					speaker: ChatMessage.getSpeaker({ actor: this.actor }),
					flavor: label
				});
			}
		}
	}
}
