//! CertNode CLI tool for receipt verification.

use certnode::{verify_receipt, Receipt, Jwks, JwksManager};
use clap::{Arg, ArgAction, Command};
use serde_json::Value;
use std::fs;
use std::io::{self, Read};
use std::path::Path;
use std::time::Duration;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let matches = Command::new("certnode")
        .version(env!("CARGO_PKG_VERSION"))
        .about("CertNode CLI for receipt verification")
        .author("CertNode <noreply@certnode.io>")
        .subcommand(
            Command::new("verify")
                .about("Verify a CertNode receipt")
                .arg(
                    Arg::new("receipt")
                        .short('r')
                        .long("receipt")
                        .value_name("FILE")
                        .help("Receipt JSON file (or stdin if not provided)")
                        .required(false),
                )
                .arg(
                    Arg::new("jwks")
                        .short('k')
                        .long("jwks")
                        .value_name("FILE_OR_URL")
                        .help("JWKS file or URL")
                        .required(true),
                )
                .arg(
                    Arg::new("verbose")
                        .short('v')
                        .long("verbose")
                        .help("Verbose output")
                        .action(ArgAction::SetTrue),
                ),
        )
        .subcommand(
            Command::new("thumbprint")
                .about("Generate JWK thumbprints")
                .arg(
                    Arg::new("jwks")
                        .short('k')
                        .long("jwks")
                        .value_name("FILE_OR_URL")
                        .help("JWKS file or URL")
                        .required(true),
                ),
        )
        .get_matches();

    match matches.subcommand() {
        Some(("verify", sub_matches)) => {
            verify_command(sub_matches).await?;
        }
        Some(("thumbprint", sub_matches)) => {
            thumbprint_command(sub_matches).await?;
        }
        _ => {
            eprintln!("No subcommand provided. Use --help for usage information.");
            std::process::exit(1);
        }
    }

    Ok(())
}

async fn verify_command(matches: &clap::ArgMatches) -> Result<(), Box<dyn std::error::Error>> {
    let verbose = matches.get_flag("verbose");

    // Load receipt
    let receipt_json = if let Some(receipt_file) = matches.get_one::<String>("receipt") {
        if verbose {
            eprintln!("Loading receipt from: {}", receipt_file);
        }
        fs::read_to_string(receipt_file)?
    } else {
        if verbose {
            eprintln!("Reading receipt from stdin...");
        }
        let mut buffer = String::new();
        io::stdin().read_to_string(&mut buffer)?;
        buffer
    };

    let receipt: Receipt = serde_json::from_str(&receipt_json)?;

    if verbose {
        eprintln!("Receipt loaded with kid: {}", receipt.kid);
    }

    // Load JWKS
    let jwks_input = matches.get_one::<String>("jwks").unwrap();
    let jwks = if jwks_input.starts_with("http://") || jwks_input.starts_with("https://") {
        if verbose {
            eprintln!("Fetching JWKS from URL: {}", jwks_input);
        }
        let manager = JwksManager::new(Duration::from_secs(300));
        manager.fetch_from_url(jwks_input).await?
    } else {
        if verbose {
            eprintln!("Loading JWKS from file: {}", jwks_input);
        }
        let jwks_json = fs::read_to_string(jwks_input)?;
        serde_json::from_str(&jwks_json)?
    };

    if verbose {
        eprintln!("JWKS loaded with {} keys", jwks.keys.len());
    }

    // Verify receipt
    match verify_receipt(&receipt, &jwks) {
        Ok(result) => {
            if result.ok {
                println!("✅ Receipt verification PASSED");
                if verbose {
                    println!("Receipt is cryptographically valid");
                    if receipt.payload_jcs_sha256.is_some() {
                        println!("JCS hash validated");
                    }
                    if receipt.receipt_id.is_some() {
                        println!("Receipt ID validated");
                    }
                }
                std::process::exit(0);
            } else {
                println!("❌ Receipt verification FAILED");
                if let Some(reason) = result.reason {
                    println!("Reason: {}", reason);
                }
                std::process::exit(1);
            }
        }
        Err(e) => {
            eprintln!("❌ Verification error: {}", e);
            std::process::exit(1);
        }
    }
}

async fn thumbprint_command(matches: &clap::ArgMatches) -> Result<(), Box<dyn std::error::Error>> {
    let jwks_input = matches.get_one::<String>("jwks").unwrap();

    // Load JWKS
    let jwks = if jwks_input.starts_with("http://") || jwks_input.starts_with("https://") {
        let manager = JwksManager::new(Duration::from_secs(300));
        manager.fetch_from_url(jwks_input).await?
    } else {
        let jwks_json = fs::read_to_string(jwks_input)?;
        serde_json::from_str(&jwks_json)?
    };

    println!("JWK Thumbprints:");
    println!("================");

    for (i, key) in jwks.keys.iter().enumerate() {
        match certnode::jwk_thumbprint(key) {
            Ok(thumbprint) => {
                let kid = match key {
                    certnode::Jwk::Ec { kid, .. } | certnode::Jwk::Okp { kid, .. } => kid,
                };

                println!("Key {}: {}", i + 1, thumbprint);
                if let Some(kid) = kid {
                    println!("  kid: {}", kid);
                }

                match key {
                    certnode::Jwk::Ec { crv, alg, .. } => {
                        println!("  type: EC ({})", crv);
                        if let Some(alg) = alg {
                            println!("  algorithm: {}", alg);
                        }
                    }
                    certnode::Jwk::Okp { crv, alg, .. } => {
                        println!("  type: OKP ({})", crv);
                        if let Some(alg) = alg {
                            println!("  algorithm: {}", alg);
                        }
                    }
                }
                println!();
            }
            Err(e) => {
                eprintln!("❌ Failed to generate thumbprint for key {}: {}", i + 1, e);
            }
        }
    }

    Ok(())
}