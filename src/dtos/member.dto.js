export class MemberListingDto {
	id;
	username;
	birthDate;
	gender;
	elo;
	email;
	role;

	constructor(member) {
		this.id = member.id;
		this.username = member.username;
		this.birthDate = member.birthdate;
		this.gender = member.gender;
		this.elo = member.elo;
		this.email = member.email;
		this.role = member.role;
	}
}

export class MemberDto {
	id;
	username;
	email;
	birthDate;
	gender;
	elo;
	role;

	constructor(member) {
		this.id = member.id;
		this.username = member.username;
		this.email = member.email;
		this.birthDate = member.birthdate;
		this.gender = member.gender;
		this.elo = member.elo;
		this.role = member.role;
	}
}
